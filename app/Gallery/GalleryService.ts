import Gallery from './Gallery';
import {v4 as uuid} from 'uuid';

export interface IGalleryService {
    createGallery: (roomId: string, bookIds: string[]) => Gallery;
    findById: (id?: string) => Gallery | undefined;
    setProgress: (id: string, active?: string, progress?: number) => void;
}

export class InMemoryGalleryService implements IGalleryService {
    private galleries : Gallery[];

    constructor() {
        this.galleries = [];
    }

    createGallery(roomId: string, bookIds: string[]) {
        const gallery = new Gallery(uuid(), bookIds, roomId);
        this.galleries.push(gallery);
        return gallery;
    }

    findById(id?: string) {
        return this.galleries.find(g => g.id === id);
    }

    setProgress(id: string, active?: string, progress?: number) {
        const gallery = this.findById(id);
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
