import Book from "../Book/Book";
import Page from "../Page/Page";
import Job from "../Job/Job";

export default interface IBookService {
    findById: (id: string) => Promise<Book | undefined>;
    create: (playerIds: string[], authorId: string) => Promise<Book>;
    nextJob: (id: string) => Promise<Job | undefined>;
    skipPage: (id: string) => Promise<Job | undefined>;
    addPage: (id: string, page: Page) => Promise<void>;
}
