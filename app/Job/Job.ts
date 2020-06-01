import {Type} from "../Page/Page";

class Job {
    readonly jobId: string;
    readonly type: Type;
    readonly playerId: string;
    readonly contents: string;
    readonly bookId: string;
    completed: boolean;

    constructor(jobId: string, type: Type, playerId: string, contents: string, bookId: string) {
        this.jobId = jobId;
        this.type = type;
        this.playerId = playerId;
        this.contents = contents;
        this.bookId = bookId;
        this.completed = false;
    }

}

export default Job;