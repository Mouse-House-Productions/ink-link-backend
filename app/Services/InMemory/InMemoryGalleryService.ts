import Gallery from "../../Gallery/Gallery";
import {v4 as uuid} from "uuid";
import IGalleryService from "../GalleryService";

export class InMemoryGalleryService implements IGalleryService {
    private galleries : Gallery[];

    constructor() {
        this.galleries = [];
    }

    async createGallery(roomId: string, bookIds: string[]) {
        const gallery = new Gallery(uuid(), bookIds, roomId);
        this.galleries.push(gallery);
        return gallery;
    }

    async findById(id?: string) {
        return this.galleries.find(g => g.id === id);
    }

    async setProgress(id: string, active?: string, progress?: number) {
        const gallery = await this.findById(id);
        if (gallery) {
            if (typeof active === "string") {
                gallery.active = active;
            }
            if (typeof progress === "number") {
                gallery.progress = progress;
            }
        }
    }
}
