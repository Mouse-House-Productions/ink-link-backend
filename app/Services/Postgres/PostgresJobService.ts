import {ClientBase} from 'pg';
import Job from "../../Job/Job";
import IJobService from "../JobService";
import {v4 as uuid} from 'uuid';


export default class PostgresJobService implements IJobService {

    private client : ClientBase;

    public constructor(client : ClientBase) {
        this.client = client;
    }

    async cancel(jobId: string): Promise<void> {
        await this.client.query('DELETE FROM job WHERE id = $1', [jobId]);
    }

    async complete(jobId: string): Promise<Job | undefined> {
        const result = await this.client.query("DELETE FROM job WHERE id = $1 RETURNING *", [jobId])
        if (result.rows.length > 0) {
            const row = result.rows[0];
            return new Job(row.id, row.type, row.player_id, row.contents, row.book_id, true);
        }
        return Promise.resolve(undefined);
    }

    async get(playerId: string): Promise<Job | undefined> {
        const result = await this.client.query('SELECT id, type, contents, book_id FROM job WHERE player_id = $1 LIMIT 1', [playerId])
        if (result.rows.length > 0) {
            const row = result.rows[0];
            return new Job(row.id, row.type, playerId, row.contents, row.book_id);
        }
        return undefined;
    }

    async getActive(): Promise<Job[]> {
        const result = await this.client.query('SELECT id, type, contents, book_id, player_id FROM job');
        return result.rows.map(row => new Job(row.id, row.type, row.player_id, row.contents, row.book_id));
    }

    async queue(job: Job | undefined): Promise<void> {
        if (job) {
            await this.client.query("INSERT INTO job VALUES($1, $2, $3, $4, $5)", [uuid(), job.type, job.playerId, job.contents, job.bookId]);
        }
    }

}