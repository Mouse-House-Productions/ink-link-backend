import Job from "./Job";
import {v4 as uuid} from 'uuid';

export interface IJobService {
    get: (playerId: string) => Job | undefined;
    getActive: () => Job[];
    complete: (jobId : string) => Job | undefined;
    cancel: (jobId: string) => void;
    queue: (job? : Job) => void;
}

export class InMemoryJobService implements IJobService {
    private jobs : Job[];

    constructor() {
        this.jobs = [];
    }

    get(playerId : string) {
        return this.jobs.find(j => !j.completed && j.playerId === playerId);
    }

    complete(jobId : string) {
        const job = this.jobs.find(j => j.jobId === jobId);
        if (job) {
            job.completed = true;
        }
        return job;
    }

    cancel(jobId: string) {
        const job = this.jobs.find(j => j.jobId === jobId);
        if (job) {
            job.completed = true;
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
