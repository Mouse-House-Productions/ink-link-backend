import BookService from "../BookService";
import Page, {Type} from "../../Page/Page";
import Book from "../../Book/Book";
import Job from "../../Job/Job";
import {ClientBase} from "pg";
import {v4 as uuid} from 'uuid';


export default class PostgresBookService implements BookService {

    private client : ClientBase;

    public constructor(client : ClientBase) {
        this.client = client;
    }

    async addPage(id: string, page: Page): Promise<void> {
        await this.client.query('INSERT INTO page(book_id, author_id, type, contents) VALUES ($1, $2, $3, $4)', [id, page.authorId, page.type, page.contents]);
        const bookPlayerId = await this.client.query('SELECT id FROM book_player WHERE book_id = $1 AND player_id = $2 ORDER BY id LIMIT 1', [id, page.authorId]);
        if (bookPlayerId.rows.length > 0) {
            await this.client.query('DELETE FROM book_player WHERE id = $1', [bookPlayerId.rows[0].id]);
        }
    }

    async create(playerIds: string[], authorId: string): Promise<Book> {
        const bookId = uuid();
        await this.client.query('INSERT INTO book(id, author_id) VALUES($1, $2)', [bookId, authorId]);
        for (let i = 0; i < playerIds.length; i++) {
            //Can we do this as a single query?
            await this.client.query('INSERT INTO book_player(book_id, player_id) VALUES($1, $2)', [bookId, playerIds[i]]);
        }
        return new Book(bookId, authorId, playerIds);
    }

    async findById(id: string): Promise<Book | undefined> {
        const bookResult = await this.client.query('SELECT author_id from book where id = $1', [id]);
        if (bookResult.rows.length > 0) {
            const authorId = bookResult.rows[0].author_id;
            const playerResult = await this.client.query('SELECT player_id FROM book_player WHERE book_id = $1 ORDER BY id', [id]);
            const players = playerResult.rows.map(row => row.player_id);
            const pageResult = await this.client.query('SELECT type, contents, author_id FROM page WHERE book_id = $1 ORDER BY id', [id]);
            const pages = pageResult.rows.map(row => new Page(row.type, row.contents, row.author_id));
            return new Book(id, authorId, players, pages);
        }
        return undefined;
    }

    async nextJob(id: string): Promise<Job | undefined> {
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

    async skipPage(id: string): Promise<Job | undefined> {
        const pages = await this.client.query('SELECT id FROM page WHERE book_id = $1', [id]);
        if (pages.rows.length === 0) {
            //If we don't yet have a page
            await this.client.query('DELETE FROM book WHERE id = $1', [id]);
            await this.client.query('DELETE FROM gallery_book WHERE book_id = $1', [id]);
        } else {
            const result = await this.client.query('SELECT id FROM book_player WHERE book_id = $1 ORDER BY id', [id]);
            if (result.rows.length > 0) {
                await this.client.query('DELETE FROM book_player WHERE id = $1', [result.rows[0].id]);
            }
            return this.nextJob(id);
        }
    }

}