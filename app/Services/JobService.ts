import Job from "../Job/Job";

export default interface IJobService {
    get: (playerId: string) => Promise<Job | undefined>;
    getActive: () => Promise<Job[]>;
    complete: (jobId : string) => Promise<Job | undefined>;
    cancel: (jobId: string) => Promise<void>;
    queue: (job? : Job) => Promise<void>;
}

