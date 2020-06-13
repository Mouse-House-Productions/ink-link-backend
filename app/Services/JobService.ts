import Job from "../Job/Job";

export default interface IJobService {
    get: (playerId: string) => Job | undefined;
    getActive: () => Job[];
    complete: (jobId : string) => Job | undefined;
    cancel: (jobId: string) => void;
    queue: (job? : Job) => void;
}

