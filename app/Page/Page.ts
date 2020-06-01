import Player from "../Player/Player";

export enum Type {
    DESCRIPTION = "description",
    DEPICTION = "depiction"
}

class Page {
    readonly type: Type;
    readonly contents: string;
    readonly authorId: string;

    public constructor(type : Type, contents : string, authorId: string) {
        this.type = type;
        this.contents = contents;
        this.authorId = authorId;
    }
}

export default Page;