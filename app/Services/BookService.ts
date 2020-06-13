import Book from "../Book/Book";
import Page from "../Page/Page";
import Job from "../Job/Job";

export default interface IBookService {
    findById: (id: string) => Book | undefined;
    findByRoomId: (roomId: string) => Book[];
    create: (playerIds: string[], authorId: string, roomId: string) => Book;
    nextJob: (id: string) => Job | undefined;
    skipPage: (id: string) => Job | undefined;
    addPage: (id: string, page: Page) => void;
}
