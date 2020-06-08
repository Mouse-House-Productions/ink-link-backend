import express, {Request} from 'express';
import {json} from "body-parser";
import cors from "cors";
import {InMemoryRoomService, IRoomService} from "./Room/RoomService";
import {InMemoryPlayerService, IPlayerService} from "./Player/PlayerService";
import {IBookService, InMemoryBookService} from "./Book/BookService";
import {IJobService, InMemoryJobService} from "./Job/JobService";
import {IGalleryService, InMemoryGalleryService} from "./Gallery/GalleryService";
import Player from "./Player/Player";
import Book from "./Book/Book";
import playerOrder from "./playerOrder";
import {Type} from "./Page/Page";
import escapeHTML from "escape-html";

const app: express.Application = express();
const port = 3001;
const roomService : IRoomService = new InMemoryRoomService();
const playerService : IPlayerService = new InMemoryPlayerService();
const bookService : IBookService = new InMemoryBookService();
const jobService : IJobService = new InMemoryJobService(bookService); //Fixme: why do we need the book service? Use callbacks?
const galleryService : IGalleryService = new InMemoryGalleryService();

app.use(json({
    limit: '10mb'
}));
app.use(cors({
    origin: '*',
    methods: '*'
}));

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.post('/join', (req : Request, res) => {
    if (req.body) {
        const playerId = req.body.playerId;
        const joinCode = req.body.joinCode;
        if (playerId && joinCode) {
            const player = playerService.getPlayer(playerId);
            if (player) {
                const room = roomService.join(player, joinCode);
                return res.send({
                    id: room.id,
                    roomCode: room.lobbyName,
                    players: room.getPlayers().map(id => ({
                        id: id,
                        name: playerService.getPlayer(id)?.name
                    }))
                });
            }
        }
    }
    res.status(400).send('Invalid join params');
});

app.post('/player', (req, res) => {
    if (req.body) {
        const name = req.body.playerName;
        if (name) {
            return res.send(playerService.createPlayer(name));
        }
    }
    res.status(400).send('Invalid player params');
})

app.post('/start', (req, res) => {
    if (req.body && req.body.roomId) {
        const room = roomService.findById(req.body.roomId);
        if (room) {
            const players = room.getPlayers();
            const shuffled : string[] = players.map(v => ({sort: Math.random(), v: v}))
                .sort((a, b) => a.sort - b.sort)
                .map(v => v.v);
            const orders : string[][] = playerOrder(shuffled);
            const books = orders.map(b => bookService.create(b, b[0], room.id));
            books.map(b => b.next()).forEach(j => jobService.queue(j));
            const gallery = galleryService.createGallery(room.id, books.map(b => b.id));
            room.galleries.add(gallery.id);
            room.activeGalleryId = gallery.id;
            return res.status(200).send({
                galleryId: gallery.id
            })
        }
    }
    res.status(404).send('Room not found');
});

app.post('/complete', (req, res) => {
    if (req.body && req.body.roomId) {
        const room = roomService.findById(req.body.roomId);
        if (room) {
            room.activeGalleryId = '';
            return res.status(200).end()
        }
    }
    res.status(404).send({
        msg: 'Room not found'
    })
});

app.get('/room', (req, res) => {
    const id = req.param('id', '');
    const room = roomService.findById(id);
    if (room) {
        res.send({
            players: room.getPlayers().map(p => playerService.getPlayer(p)),
            galleryId: room.activeGalleryId,
            galleries: [...room.galleries].filter(g => g !== room.activeGalleryId)
        });
    } else {
        res.status(404).send('Not found');
    }
});

app.get('/waiting', (req, res) => {
    const id = req.param('id', '');
    const roomId = req.param('roomId', '');
    const job = jobService.get(id);
    const room = roomService.findById(roomId);
    const gallery = galleryService.findById(room?.activeGalleryId);
    const complete = gallery && (gallery.bookIds.map(b => bookService.findById(b)).find(b => b && !b.complete()) === undefined);
    res.send({
        job, complete
    });
})

app.get('/books', (req, res) => {
    const id = req.param('roomId', '');
    const room = roomService.findById(id);
    if (room) {
        const players = room.getPlayers()
            .map(p => playerService.getPlayer(p))
            .filter((p): p is Player => typeof p !== "undefined")
            .reduce((map, p) => map.set(p.id, p.name), new Map<string, string>());
        const books = bookService.findByRoomId(id).map(b => ({
            pages: b.pages.map(p => ({
                type: p.type,
                contents: p.contents,
                author: players.get(p.authorId)
            })),
            author: players.get(b.authorId)
        }))
        res.send({books});
    } else {
        res.status(404).send('Room not found');
    }
})

app.post('/job', (req, res) => {
    if (req.body && req.body.id && req.body.contents) {
        jobService.complete(req.body.id, req.body.contents);
        res.status(200).end();
    } else{
        res.status(400).send('Bad complete params');
    }
});

//TOOD:Add some middleware that generates the 404 if you return undefined/don't send something
app.get('/gallery', (req, res) => {
    const id = req.param('galleryId', '');
    const gallery = galleryService.findById(id);
    if (gallery) {
        res.status(200).send({
            active: gallery.active,
            progress: gallery.progress
        });
    } else {
        res.status(404).send({
            msg: "Gallery not found"
        })
    }
})

app.get('/gallery/books', (req, res) => {
    const id = req.param('galleryId', '');
    const gallery = galleryService.findById(id);
    if (gallery) {
        const room = roomService.findById(gallery.roomId);
        if (room) {
            const players = room.getPlayers()
                .map(p => playerService.getPlayer(p))
                .filter((p): p is Player => typeof p !== "undefined")
                .reduce((map, p) => map.set(p.id, p.name), new Map<string, string>());
            const books = gallery.bookIds.map(b => bookService.findById(b))
                .filter((b): b is Book => typeof b !== "undefined")
                .map(b => ({
                    id: b.id,
                    pages: b.pages.map(p => ({
                        type: p.type,
                        contents: p.contents,
                        author: players.get(p.authorId)
                    })),
                    author: players.get(b.authorId)
                }));
            res.status(200).send({books});
        } else {
            res.status(404).send({
                msg: 'Gallery not found'
            })
        }
    } else {
        res.status(404).send({
            msg: 'Gallery not found'
        })
    }
});

app.get('/gallery/download', (req, res) => {
    const id = req.param('galleryId', '');
    const gallery = galleryService.findById(id);
    const prefix = '<!DOCTYPE html><html lang="en"><head><link href="https://fonts.googleapis.com/css2?family=Caveat+Brush&display=swap" rel="stylesheet"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ink Link Gallery</title></head><body><style> body { font-family: "Caveat Brush", "Arial", "Helvetica", "sans-serif"; background: #eff1f3; } .book { display: flex; flex-direction: column; width: 100vw; align-items: center; } .book > h1 { width: 95%; } .book > * { padding: 1rem; } .picture { display: flex; flex-direction: column; align-items: flex-end; } .picture img { max-width: 95vw; margin: auto; border: 2px solid #223843; background: #ffffff; }</style>'
    const suffix = '</body></html>';
    if (gallery) {
        const page = prefix
            + gallery.bookIds.map(b => bookService.findById(b))
                .filter((b): b is Book => typeof b !== "undefined")
                .map(b => {
                    const bookAuthor = playerService.getPlayer(b.authorId);
                    const name = escapeHTML((bookAuthor) ? bookAuthor.name : 'Unknown');
                    return `<h1>${name}'s book</h1>${b.pages.map(p => {
                        const player = playerService.getPlayer(p.authorId);
                        const name = escapeHTML((player) ? player.name : 'Unknown');
                        if (p.type === Type.DESCRIPTION) {
                            return `<span>${name}: "${escapeHTML(p.contents)}"</span>`;
                        } else if (p.type === Type.DEPICTION) {
                            return `<div class="picture"><img src="${escapeHTML(p.contents)}" alt="Picture by ${name}"/><span>By ${name}</span></div>`
                        }
                    }).join('')}`;
                }).join('')
            + suffix;
        res.status(200)
            .header('Content-Type', 'text/html; charset=UTF-8')
            .send(page);
    } else {
        res.status(404)
            .header('Content-Type', 'text/html; charset=UTF-8')
            .send('<html lang="en"><head><title>Ink Link Gallery - 404</title></head><body><p>Sorry, that gallery could not be found</p></body></html>');
    }
});

app.post('/gallery', (req,res) => {
    const id = req.body.galleryId;
    const gallery = galleryService.findById(id);
    if (gallery) {
        if (typeof req.body.active === "string") {
            gallery.active = req.body.active;
        }

        if (typeof req.body.progress === "number") {
            gallery.progress = req.body.progress;
        }
        res.status(200).end();
    } else {
        res.status(404).send({
            msg: 'Gallery not found'
        })
    }
})

app.listen(port, () => {
    console.log(`Ink Link listening on ${port}!`);
});
