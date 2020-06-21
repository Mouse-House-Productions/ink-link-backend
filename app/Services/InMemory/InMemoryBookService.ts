import Book from "../../Book/Book";
import {v4 as uuid} from "uuid";
import Page, {Type} from "../../Page/Page";
import Job from "../../Job/Job";
import IBookService from "../BookService";

export default class InMemoryBookService implements IBookService {
    private books: Book[];

    constructor() {
        this.books = [];
    }

    async findById(id: string) {
        return this.books.find(b => b.id === id);
    }

    async create(playerIds: string[], authorId: string) {
        const book = new Book(uuid(), authorId, playerIds);
        this.books.push(book);
        return book;
    }

    async addPage(id: string, page: Page) {
        const book = await this.findById(id);
        if (book) {
            book.players.shift();
            book.pages.push(page);
        }
    }

    async nextJob(id: string) {
        const book = await this.findById(id);
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

    async skipPage(id: string) {
        const book = await this.findById(id);
        if (book) {
            book.players.shift();
            return this.nextJob(id);
        }
    }

}
