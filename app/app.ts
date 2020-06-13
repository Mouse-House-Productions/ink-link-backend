import express, {Request} from 'express';
import {json} from "body-parser";
import cors from "cors";
import Player, {State} from "./Player/Player";
import Book from "./Book/Book";
import playerOrder from "./playerOrder";
import Page, {Type} from "./Page/Page";
import escapeHTML from "escape-html";
import InMemoryServices from "./Services/InMemory/InMemoryServices";
import Persistence, {PersistenceProvider} from "./Persistence/Persistence";

const app: express.Application = express();
const port = 3001;
const provider = new InMemoryServices();
const p : PersistenceProvider = Persistence<void>(() => Promise.resolve(), () => true, () => Promise.resolve(), () => Promise.resolve(), provider);

app.use(json({
    limit: '10mb'
}));

app.use(cors({
    origin: '*',
    methods: '*'
}));

app.use(async (req, res, next) => {
    try {
        const header = req.header("X-InkLink-UserId");
        if (header) {
            await p.execute(s => s.playerService.seen(header));
        }
        next();
    } catch (err) {
        next(err);
    }
});

setInterval(() => {
    Promise.resolve(p.execute(s => {
        s.jobService.getActive()
            .map(j => ({j: j, p: s.playerService.getPlayer(j.playerId)}))
            .filter(jp => !jp.p || jp.p.state === State.INACTIVE)
            .forEach(jp => {
                s.jobService.cancel(jp.j.jobId);
                s.jobService.queue(s.bookService.skipPage(jp.j.bookId));
            })
    }));
}, 1000);

app.post('/join', (req : Request, res) => {
    if (req.body) {
        const playerId = req.body.playerId;
        const joinCode = req.body.joinCode;
        if (playerId && joinCode) {
            return p.execute(s => {
                const player = s.playerService.getPlayer(playerId);
                if (player) {
                    const room = s.roomService.join(player, joinCode);
                    return res.send({
                        id: room.id,
                        roomCode: room.lobbyName,
                        players: s.roomService.players(room.id).map(id => ({
                            id: id,
                            name: s.playerService.getPlayer(id)?.name
                        }))
                    });
                }
            });
        }
    }
    return res.status(400).send('Invalid join params');
});

app.post('/leave', (req, res) => {
    if (req.body) {
        p.execute(s => {
            s.playerService.markInactive(req.body.playerId);
        }).then();
    }
    res.status(201).send();
});

app.post('/checkin', (req, res) => {
    res.status(201).send();
});


app.post('/player', (req, res) => {
    if (req.body) {
        const name = req.body.playerName;
        if (name) {
            return p.execute(s => { return s.playerService.createPlayer(name) })
                .then(p => res.status(200).send(p));
        }
    }
    res.status(400).send('Invalid player params');
})

app.post('/start', (req, res) => {
    if (req.body && req.body.roomId) {
        return p.execute(s => {
            const room = s.roomService.findById(req.body.roomId);
            if (room) {
                const players = s.roomService.players(room.id).filter(p => s.playerService.getPlayer(p)?.state === State.ACTIVE);
                const shuffled : string[] = players.map(v => ({sort: Math.random(), v: v}))
                    .sort((a, b) => a.sort - b.sort)
                    .map(v => v.v);
                const orders : string[][] = playerOrder(shuffled);
                const books = orders.map(b => s.bookService.create(b, b[0], room.id));
                const gallery = s.galleryService.createGallery(room.id, books.map(b => b.id));
                if (s.roomService.addGallery(room.id, gallery.id)) {
                    books.map(b => s.bookService.nextJob(b.id)).forEach(j => s.jobService.queue(j));
                    return {status: 200, body: {galleryId: gallery.id}};
                } else {
                    return {status: 409, body: {msg: 'Room already has an active gallery'}};
                }
            }
            return {status: 404, body: {msg: 'Room not found'}};
        }).then(sb => res.status(sb.status).send(sb.body));
    }
    res.status(400).send({msg: 'Missing params'});
});

app.post('/complete', (req, res) => {
    if (req.body && req.body.roomId) {
        return p.execute(s => { s.roomService.clearGallery(req.body.roomId); })
            .then(() => res.status(204).end())
    }
    res.status(400).send({
        msg: 'Missing params'
    })
});

app.get('/room', (req, res) => {
    const id = req.query.id;
    if (typeof id === "string") {
        return p.read().then(s => {
            const room = s.roomService.findById(id);
            if (room) {
                return res.status(200).send({
                    players: s.roomService.players(room.id).map(p => s.playerService.getPlayer(p)),
                    galleryId: room.activeGalleryId,
                    galleries: [...room.galleries].filter(g => g !== room.activeGalleryId)
                });
            }
            return res.status(404).send({msg: 'Room not found'});
        });
    } else {
        res.status(400).send({msg: 'Missing params'});
    }
});

app.get('/waiting', (req, res) => {
    const id = req.query.id;
    const roomId = req.query.roomId;
    if (typeof id === "string" && typeof roomId === "string") {
        return p.read().then(s => {
            const job = s.jobService.get(id);
            const room = s.roomService.findById(roomId);
            const gallery = s.galleryService.findById(room?.activeGalleryId);
            const complete = gallery && (gallery.bookIds.map(b => s.bookService.findById(b)).find(b => b && !b.complete()) === undefined);
            return res.send({job, complete});
        });
    } else {
        res.status(400).send({msg: 'Missing params'});
    }
})

app.get('/books', (req, res) => {
    const id = req.query.roomId;
    if (typeof id === "string") {
        p.read().then(s => {
            const room = s.roomService.findById(id);
            if (room) {
                const players = s.roomService.players(room.id)
                    .map(p => s.playerService.getPlayer(p))
                    .filter((p): p is Player => typeof p !== "undefined")
                    .reduce((map, p) => map.set(p.id, p.name), new Map<string, string>())
                const books = s.bookService.findByRoomId(id).map(b => ({
                    pages: b.pages.map(p => ({
                        type: p.type,
                        contents: p.contents,
                        author: players.get(p.authorId)
                    })),
                    author: players.get(b.authorId)
                }));
                res.status(200).send({books})
            } else {
                res.status(404).send({msg: 'Room not found'});
            }
        });
    } else {
        res.status(400).send({msg: 'Missing params'});
    }
})

app.post('/job', (req, res) => {
    if (req.body && req.body.id && req.body.contents) {
        p.execute(s => {
            const job = s.jobService.complete(req.body.id);
            if (job) {
                const page = new Page(job.type, req.body.contents, job.playerId);
                s.bookService.addPage(job.bookId, page);
                s.jobService.queue(s.bookService.nextJob(job.bookId));
            }
        }).then(()=> res.status(204).end());
    } else{
        res.status(400).send('Bad complete params');
    }
});

app.get('/gallery', (req, res) => {
    const id = req.query.galleryId;
    if (typeof id === "string") {
        p.read()
            .then(s => {
                const gallery = s.galleryService.findById(id);
                if (gallery) {
                    return res.status(200).send({
                        active: gallery.active,
                        progress: gallery.progress
                    });
                } else {
                    return res.status(404).send({
                        msg: 'Gallery not found'
                    });
                }
            });
    } else {
        return res.status(400).send({msg: 'Missing params'});
    }
})

//Are both gallery/books and /books used?
app.get('/gallery/books', (req, res) => {
    const id = req.query.galleryId;
    if (typeof id === "string") {
        return p.read()
            .then(s => {
                const gallery = s.galleryService.findById(id);
                if (gallery) {
                    const room = s.roomService.findById(gallery.roomId);
                    if (room) {
                        //Is this map really necessary? We could just make the individual queries inline.
                        const players = s.roomService.players(room.id)
                            .map(p => s.playerService.getPlayer(p))
                            .filter((p): p is Player => typeof p !== "undefined")
                            .reduce((map, p) => map.set(p.id, p.name), new Map<string, string>());
                        const books = gallery.bookIds.map(b => s.bookService.findById(b))
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
                    }}
            });
    } else {
        return res.status(400).send({msg: 'Missing params'});
    }
});

app.get('/gallery/download', (req, res) => {
    const id = req.query.galleryId;
    if (typeof id === "string") {
        p.read().then(s => {
            const gallery = s.galleryService.findById(id);
            const prefix = '<!DOCTYPE html><html lang="en"><head><link href="https://fonts.googleapis.com/css2?family=Caveat+Brush&display=swap" rel="stylesheet"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ink Link Gallery</title></head><body><style> body { font-family: "Caveat Brush", "Arial", "Helvetica", "sans-serif"; background: #eff1f3; } .book { display: flex; flex-direction: column; width: 100vw; align-items: center; } .book > h1 { width: 95%; } .book > * { padding: 1rem; } .picture { display: flex; flex-direction: column; align-items: flex-end; } .picture img { max-width: 95vw; margin: auto; border: 2px solid #223843; background: #ffffff; }</style>'
            const suffix = '</body></html>';
            if (gallery) {
                const page = prefix
                    + gallery.bookIds.map(b => s.bookService.findById(b))
                        .filter((b): b is Book => typeof b !== "undefined")
                        .map(b => {
                            const bookAuthor = s.playerService.getPlayer(b.authorId);
                            const name = escapeHTML((bookAuthor) ? bookAuthor.name : 'Unknown');
                            return `<h1>${name}'s book</h1>${b.pages.map(p => {
                                const player = s.playerService.getPlayer(p.authorId);
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
    } else {
        res.status(400).send({msg: 'Missing params'})
    }
});

app.post('/gallery', (req,res) => {
    const id = req.body.galleryId;
    let active : string, progress : number;
    if (typeof req.body.active === "string") {
        active = req.body.active;
    }

    if (typeof req.body.progress === "number") {
        progress = req.body.progress;
    }

    return p.execute(s => { s.galleryService.setProgress(id, active, progress); })
        .then(() => res.status(204).end());
})

app.listen(port, () => {
    console.log(`Ink Link listening on ${port}!`);
});
