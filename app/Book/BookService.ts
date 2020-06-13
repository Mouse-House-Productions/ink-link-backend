import Book from "./Book";
import Page, {Type} from "../Page/Page";
import Job from "../Job/Job";

import {v4 as uuid} from 'uuid';

export interface IBookService {
    findById: (id: string) => Book | undefined;
    findByRoomId: (roomId: string) => Book[];
    create: (playerIds: string[], authorId: string, roomId: string) => Book;
    nextJob: (id: string) => Job | undefined;
    skipPage: (id: string) => Job | undefined;
    addPage: (id: string, page: Page) => void;
}

export class InMemoryBookService implements IBookService {
    private books: Book[];

    constructor() {
        this.books = [];
    }

    findById(id: string) {
        return this.books.find(b => b.id === id);
    }

    create(playerIds: string[], authorId: string, roomId: string) {
        const book = new Book(uuid(), authorId, playerIds, roomId);
        this.books.push(book);
        return book;
    }

    findByRoomId(roomId: string) {
        return this.books.filter(b => b.roomId === roomId);
    }

    addPage(id: string, page: Page) {
        const book = this.findById(id);
        if (book) {
            book.players.shift();
            book.pages.push(page);
        }
    }

    nextJob(id: string) {
        const book = this.findById(id);
        if (book) {
            const pages = book.pages;
            const players = book.players;
            if (players.length > 0) {
                const page = pages.length > 0 ? pages[pages.length - 1] : undefined;
                 const type = (page ? (page.type === Type.DEPICTION ? Type.DESCRIPTION : Type.DEPICTION) : Type.DESCRIPTION);
                 const contents = page ? page.contents : '';
                 return new Job("", type, players[0], contents, id);
            }
        }

        return undefined;
    }

    skipPage(id: string) {
        const book = this.findById(id);
        if (book) {
            book.players.shift();
            return this.nextJob(id);
        }
    }

}
