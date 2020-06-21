class Gallery {
    readonly id: string;
    bookIds: string[];
    roomId: string;
    active: string;
    progress: number;

    constructor(id: string, bookIds: string[], roomId: string, active?: string, progress?: number) {
        this.id = id;
        this.bookIds = bookIds;
        this.roomId = roomId;
        this.active = active || '';
        if (typeof progress === "number") {
            this.progress = progress;
        } else {
            this.progress = -1;
        }
    }
}

export default Gallery;