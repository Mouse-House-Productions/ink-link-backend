import Job from "../../Job/Job";
import {v4 as uuid} from "uuid";
import IJobService from "../JobService";

export default class InMemoryJobService implements IJobService {
    private jobs : Job[];

    constructor() {
        this.jobs = [];
    }

    async get(playerId : string) {
        return this.jobs.find(j => !j.completed && j.playerId === playerId);
    }

    async complete(jobId : string) {
        const job = this.jobs.find(j => j.jobId === jobId);
        if (job) {
            job.completed = true;
        }
        return job;
    }

    async cancel(jobId: string) {
        const job = this.jobs.find(j => j.jobId === jobId);
        if (job) {
            job.completed = true;
        }
    }

    async getActive() {
        return this.jobs.filter(j => !j.completed);
    }

    async queue(job?: Job) {
        if (job) {
            this.jobs.push(new Job(uuid(), job.type, job.playerId, job.contents, job.bookId));
        }
    }
}
