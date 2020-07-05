import express from 'express';
import {addAsync, ExpressWithAsync} from '@awaitjs/express';
import {json} from "body-parser";
import cors from "cors";
import Player, {State} from "./Player/Player";
import Book from "./Book/Book";
import playerOrder from "./playerOrder";
import Page, {Type} from "./Page/Page";
import escapeHTML from "escape-html";
// import InMemoryServices from "./Services/InMemory/InMemoryServices";
import Persistence, {PersistenceProvider} from "./Persistence/Persistence";
import Job from "./Job/Job";
import {Pool, PoolClient} from "pg";
import PostgresServices from "./Services/Postgres/PostgresServices";
import hat from "hat";

const app: ExpressWithAsync = addAsync(express());
const port = 3001;
// const provider = new InMemoryServices();
// const p : PersistenceProvider = Persistence<void>(() => Promise.resolve(), () => Promise.resolve(), () => Promise.resolve(), () => Promise.resolve(), provider);

const provider = new PostgresServices();
const pool = new Pool();
const p : PersistenceProvider = Persistence<PoolClient>(() => pool.connect(), c => c.query('COMMIT'), c => c.query('ROLLBACK'), () => pool.connect(), c => c.release(), provider);

app.use(json({
    limit: '10mb'
}));

app.use(cors({
    origin: '*',
    methods: '*'
}));

app.useAsync(async (req) => {
    const header = req.header("X-InkLink-UserId");
    if (header) {
        await p.execute(s => s.playerService.seen(header));
    }
});

const cancelInactive = (() => {
    p.execute(async s => {
        const jobs : Job[] = await s.jobService.getActive();
        const jobsWithPlayers = await Promise.all(jobs.map(j => s.playerService.getPlayer(j.playerId).then(p => ({j,p}))));
        await Promise.all(jobsWithPlayers.filter(jp => !jp.p || jp.p.state === State.INACTIVE).map(jp => {s.jobService.cancel(jp.j.jobId).then(() => s.metricsService.jobSkip()).then(() => s.bookService.skipPage(jp.j.bookId).then(j => s.jobService.queue(j)))}));
    })
        .catch(ex => console.log(ex))
        .finally(() => setTimeout(cancelInactive, 1000))
});
cancelInactive();

app.postAsync('/join', async (req, res) => {
    if (req.body) {
        const playerName = req.body.playerName;
        const joinCode = req.body.joinCode;
        if (playerName && joinCode) {
            return p.execute(async s => {
                const player = await s.playerService.createPlayer(playerName);
                s.metricsService.player();
                const room = await s.roomService.join(player, joinCode);
                const pids = await s.roomService.players(room.id);
                if (pids.length === 1) {
                    s.metricsService.room();
                }
                const players = await Promise.all(pids.map(id => s.playerService.getPlayer(id).then(p => ({id, name: p?.name}))));
                return res.send({
                    id: room.id,
                    roomCode: room.lobbyName,
                    playerId: player.id,
                    players
                });
            });
        }
    }
    return res.status(400).send('Invalid join params');
});

app.postAsync('/leave', async(req, res) => {
    if (req.body) {
        await p.execute(s => {
            s.playerService.markInactive(req.body.playerId);
            s.metricsService.leave();
        });
    }
    res.status(201).send();
});

app.post('/checkin', (req, res) => {
    res.status(201).send();
});

app.postAsync('/start', async (req, res) => {
    if (req.body && req.body.roomId) {
        await p.execute(async s => {
            const room = await s.roomService.findById(req.body.roomId);
            if (room) {
                const shuffled : string[] = (await Promise.all((await s.roomService.players(room.id)).map(p => s.playerService.getPlayer(p))))
                    .filter((p): p is Player => p?.state === State.ACTIVE)
                    .map(v => ({sort: Math.random(), v: v.id}))
                    .sort((a, b) => a.sort - b.sort)
                    .map(v => v.v);
                const orders : string[][] = playerOrder(shuffled);
                const books = await Promise.all(orders.map(b => s.bookService.create(b, b[0])));
                const gallery = await s.galleryService.createGallery(room.id, books.map(b => b.id));
                s.metricsService.gallery(shuffled.length);
                if (await s.roomService.addGallery(room.id, gallery.id)) {
                    await Promise.all((await Promise.all(books.map(b => s.bookService.nextJob(b.id)))).map(j => s.jobService.queue(j)));
                    res.status(200).send({galleryId: gallery.id});
                } else {
                    res.status(409).send({msg: 'Room already has an active gallery'});
                    throw new Error('Room already has an active gallery');
                }
            }
        });
    } else {
        res.status(400).send({msg: 'Missing params'});
    }
});

app.postAsync('/complete', async (req, res) => {
    if (req.body && req.body.roomId && req.body.galleryId) {
        await p.execute(async s => {
            const gallery = await s.galleryService.findById(req.body.galleryId);
            let complete = false;
            if (gallery) {
                const books = await Promise.all(gallery.bookIds.map(b => s.bookService.findById(b)));
                complete = books.find(b => b && !b.complete()) === undefined;
            }

            if (complete) {
                return s.roomService.clearGallery(req.body.roomId, req.body.galleryId);
            }
        });
        res.status(204).end();
    } else {
        res.status(400).send({
            msg: 'Missing params'
        })
    }
});

app.getAsync('/room', async (req, res) => {
    const id = req.query.id;
    if (typeof id === "string") {
        const s = await p.read();
        const room = await s.roomService.findById(id);
        if (room) {
            const players = await Promise.all([...room.players.values()].map(p => s.playerService.getPlayer(p)));
            return res.status(200).send({
                players, galleryId: room.activeGalleryId, galleries: [...room.galleries].filter(g => g !== room.activeGalleryId)
            });
        }
        return res.status(404).send({msg: 'Room not found'});
    } else {
        return res.status(400).send({msg: 'Missing params'});
    }
});

app.getAsync('/waiting', async (req, res) => {
    const id = req.query.id;
    const roomId = req.query.roomId;
    if (typeof id === "string" && typeof roomId === "string") {
        const s = await p.read();
        const job = await s.jobService.get(id);
        const room = await s.roomService.findById(roomId);
        const gallery = await s.galleryService.findById(room?.activeGalleryId);
        let complete = false;
        if (gallery) {
            const books = await Promise.all(gallery.bookIds.map(b => s.bookService.findById(b)));
            complete = books.find(b => b && !b.complete()) === undefined;
        }
        return res.send({job, complete});
    } else {
        res.status(400).send({msg: 'Missing params'});
    }
})

app.post('/job', async (req, res) => {
    if (req.body && req.body.id && req.body.contents) {
        await p.execute(async s => {
            const job = await s.jobService.complete(req.body.id);
            if (job) {
                job.type === Type.DEPICTION ? s.metricsService.picture() : s.metricsService.description();
                const page = new Page(job.type, req.body.contents, job.playerId);
                await s.bookService.addPage(job.bookId, page);
                let nextJob = await s.bookService.nextJob(job.bookId);
                await s.jobService.queue(nextJob);
            }
        });
        return res.status(204).end();
    } else {
        res.status(400).send('Bad complete params');
    }
});

app.getAsync('/gallery', async (req, res) => {
    const id = req.query.galleryId;
    if (typeof id === "string") {
        const s = await p.read();
        const gallery = await s.galleryService.findById(id);
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
    } else {
        return res.status(400).send({msg: 'Missing params'});
    }
})

app.getAsync('/gallery/books', async (req, res) => {
    const id = req.query.galleryId;
    if (typeof id === "string") {
        const s = await p.read();
        const gallery = await s.galleryService.findById(id);
        if (gallery) {
            const room = await s.roomService.findById(gallery.roomId);
            if (room) {
                const players = (await Promise.all([...room.players.values()]
                    .map(p => s.playerService.getPlayer(p))))
                    .filter((p): p is Player => typeof p !== "undefined")
                    .reduce((map, p) => map.set(p.id, p.name), new Map<string, string>());
                const books = (await Promise.all(gallery.bookIds.map(b => s.bookService.findById(b))))
                    .filter((b): b is Book => typeof b !== "undefined")
                    .map(b => ({
                            id: b.id,
                            pages: b.pages.map(p => ({
                                type: p.type,
                                contents: p.contents,
                                author: players.get(p.authorId)
                            })),
                            author: players.get(b.authorId)
                        })
                    );
                return res.status(200).send({books});
            } else {
                return res.status(404).send({
                    msg: 'Gallery not found'
                });
            }
        }
    } else {
        return res.status(400).send({msg: 'Missing params'});
    }
});

app.getAsync('/gallery/download', async (req, res) => {
    const id = req.query.galleryId;
    if (typeof id === "string") {
        const s = await p.read();
        s.metricsService.download();
        const gallery = await s.galleryService.findById(id);
        const prefix = '<!DOCTYPE html><html lang="en"><head><link href="https://fonts.googleapis.com/css2?family=Caveat+Brush&display=swap" rel="stylesheet"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ink Link Gallery</title></head><body><style> body { font-family: "Caveat Brush", "Arial", "Helvetica", "sans-serif"; background: #eff1f3; } .book { display: flex; flex-direction: column; width: 100vw; align-items: center; } .book > h1 { width: 95%; } .book > * { padding: 1rem; } .picture { display: flex; flex-direction: column; align-items: flex-end; } .picture img { max-width: 95vw; margin: auto; border: 2px solid #223843; background: #ffffff; }</style>'
        const suffix = '</body></html>';
        if (gallery) {
            const room = await s.roomService.findById(gallery?.roomId);
            if (room) {
                const players = (await Promise.all([...room.players.values()]
                    .map(p => s.playerService.getPlayer(p))))
                    .filter((p): p is Player => typeof p !== "undefined")
                    .reduce((map, p) => map.set(p.id, p.name), new Map<string, string>());
                const books = (await Promise.all(gallery.bookIds.map(b => s.bookService.findById(b))))
                    .filter((b): b is Book => typeof b !== "undefined")
                    .map(b => {
                        const bookAuthor = players.get(b.authorId);
                        const name = escapeHTML((bookAuthor) ? bookAuthor : 'Unknown');
                        return `<h1>${name}'s book</h1>${b.pages.map(p => {
                            const player = players.get(p.authorId);
                            const name = escapeHTML((player) ? player : 'Unknown');
                            if (p.type === Type.DESCRIPTION) {
                                return `<span>${name}: "${escapeHTML(p.contents)}"</span>`;
                            } else if (p.type === Type.DEPICTION) {
                                return `<div class="picture"><img src="${escapeHTML(p.contents)}" alt="Picture by ${name}"/><span>By ${name}</span></div>`
                            }
                        }).join('')}`;
                    });
                return res.status(200)
                    .header('Content-Type', 'text/html; charset=UTF-8')
                    .send(prefix + books + suffix);
            }
        }
        return res.status(404)
            .header('Content-Type', 'text/html; charset=UTF-8')
            .send('<html lang="en"><head><title>Ink Link Gallery - 404</title></head><body><p>Sorry, that gallery could not be found</p></body></html>');
    } else {
        res.status(400).send({msg: 'Missing params'})
    }
});

app.postAsync('/gallery', async (req, res) => {
    const id = req.body.galleryId;
    let active : string, progress : number;
    if (typeof req.body.active === "string") {
        active = req.body.active;
    }

    if (typeof req.body.progress === "number") {
        progress = req.body.progress;
    }

    await p.execute(s => s.galleryService.setProgress(id, active, progress));
    return res.status(204).end();
});

const metricAuth = (process.env.METRIC_AUTH || hat());

app.useAsync('/metrics', async (req, res) => {
    let header = req.header("X-InkLink-Metric-Auth");
    if (header === metricAuth) {
        let metrics = (await p.read()).metricsService.metrics().getMetricsAsJSON();
        res.status(200).send(metrics);
    } else {
        res.status(401).end();
    }
});

app.listen(port, () => {
    console.log(`Ink Link listening on ${port}!`);
    if (metricAuth !== process.env.METRIC_AUTH) {
        console.log(`No auth token set, using temporary key ${metricAuth}`)
    }
});
