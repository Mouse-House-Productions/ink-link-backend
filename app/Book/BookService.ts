import Book from "./Book";
import {v4 as uuid} from 'uuid';

export interface IBookService {
    findById: (id: string) => Book | undefined;
    findByRoomId: (roomId: string) => Book[];
    create: (playerIds: string[], authorId: string, roomId: string) => Book;
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
}