import IGalleryService from "../GalleryService";
import Gallery from "../../Gallery/Gallery";
import {ClientBase} from "pg";
import {v4 as uuid} from 'uuid';

export default class PostgresGalleryService implements IGalleryService {

    private client : ClientBase;

    public constructor(client : ClientBase) {
        this.client = client;
    }

    async createGallery(roomId: string, bookIds: string[]): Promise<Gallery> {
        const galleryId = uuid();
        await this.client.query('INSERT INTO gallery(id, room_id) VALUES ($1, $2)', [galleryId, roomId]);
        for (let i = 0; i < bookIds.length; i++) {
            await this.client.query('INSERT INTO gallery_book(gallery_id, book_id) VALUES ($1, $2)', [galleryId, bookIds[i]]);
        }
        return new Gallery(galleryId, bookIds, roomId);
    }

    async findById(id: string | undefined): Promise<Gallery | undefined> {
        if (id) {
            const result = await this.client.query('SELECT room_id, active, progress FROM gallery WHERE id = $1', [id]);
            if (result.rows.length > 0) {
                const row = result.rows[0];
                const bookResult = await this.client.query('SELECT book_id from gallery_book WHERE gallery_id = $1 ORDER BY id', [id]);
                const bookIds = bookResult.rows.map(row => row.book_id);
                return new Gallery(id, bookIds, row.room_id, row.active, row.progress);
            }
        }
        return undefined;
    }

    async setProgress(id: string, active: string | undefined, progress: number | undefined): Promise<void> {
        const setProgress = typeof progress === "number";
        const setActive = typeof active === "string";
        if (active?.length === 0) {
            active = undefined;
        }
        if (setProgress && setActive) {
            await this.client.query('UPDATE gallery SET progress = $1, active = $2 WHERE id = $3', [progress, active, id]);
        } else if (setProgress) {
            await this.client.query('UPDATE gallery SET progress = $1 WHERE id = $2', [progress, id]);
        } else if (setActive) {
            await this.client.query('UPDATE gallery SET active = $1 WHERE id = $2', [active, id]);
        }
    }

}