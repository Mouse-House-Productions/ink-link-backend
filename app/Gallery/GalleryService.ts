import Gallery from './Gallery';
import {v4 as uuid} from 'uuid';

export interface IGalleryService {
    createGallery: (roomId: string, bookIds: string[]) => Gallery;
    findById: (id?: string) => Gallery | undefined;
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

}