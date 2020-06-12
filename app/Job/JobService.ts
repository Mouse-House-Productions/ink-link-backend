import Job from "./Job";
import {v4 as uuid} from 'uuid';
import {IBookService} from "../Book/BookService";

export interface IJobService {
    get: (playerId: string) => Job | undefined;
    getActive: () => Job[];
    complete: (jobId : string, contents: string) => void;
    skip: (jobId: string) => void;
    queue: (job? : Job) => void;
}

export class InMemoryJobService implements IJobService {
    private bookService : IBookService;
    private jobs : Job[];

    constructor(bookService: IBookService) {
        this.bookService = bookService;
        this.jobs = [];
    }

    get(playerId : string) {
        return this.jobs.find(j => !j.completed && j.playerId === playerId);
    }

    complete(jobId : string, contents: string) {
        const job = this.jobs.find(j => j.jobId === jobId);
        if (job) {
            job.completed = true;
            const book = this.bookService.findById(job.bookId);
            const next = book?.addPage(job, contents);
            if (next) {
                this.jobs.push(new Job(uuid(), next.type, next.playerId, next.contents, next.bookId));
            }
        }
    }

    skip(jobId: string) {
        const job = this.jobs.find(j => j.jobId === jobId);
        if (job) {
            job.completed = true;
            const book = this.bookService.findById(job.bookId);
            const next = book?.skip();
            if (next) {
                this.jobs.push(new Job(uuid(), next.type, next.playerId, next.contents, next.bookId));
            }
        }
    }

    getActive() {
        return this.jobs.filter(j => !j.completed);
    }

    queue(job?: Job) {
        if (job) {
            this.jobs.push(new Job(uuid(), job.type, job.playerId, job.contents, job.bookId));
        }
    }

}