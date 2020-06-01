class Gallery {
    readonly id: string;
    bookIds: string[];
    roomId: string;
    active: string;
    progress: number;

    constructor(id: string, bookIds: string[], roomId: string) {
        this.id = id;
        this.bookIds = bookIds;
        this.roomId = roomId;
        this.active = '';
        this.progress = -1;
    }
}

export default Gallery;