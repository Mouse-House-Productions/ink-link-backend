import IRoomService from "../RoomService";
import {ClientBase} from "pg";
import Room from "../../Room/Room";
import Player from "../../Player/Player";
import {v4 as uuid} from 'uuid';


export default class PostgresRoomService implements IRoomService {

    private client : ClientBase;

    public constructor(client : ClientBase) {
        this.client = client;
    }

    async addGallery(id: string, galleryId: string): Promise<boolean> {
        const result = await this.client.query('UPDATE room SET active_gallery_id = $1 WHERE active_gallery_id is null AND id = $2', [galleryId, id]);
        if (result.rowCount > 0) {
            await this.client.query('INSERT INTO room_gallery(room_id, gallery_id) VALUES ($1, $2)', [id, galleryId]);
            return true;
        }
        return false;
    }

    async clearGallery(id: string, galleryId: string): Promise<void> {
        await this.client.query('UPDATE room SET active_gallery_id = null WHERE id = $1 AND active_gallery_id = $2', [id, galleryId]);
    }

    async findById(id: string): Promise<Room | undefined> {
        const roomResult = await this.client.query('SELECT lobby_name, active_gallery_id FROM room WHERE id = $1', [id]);

        if (await this.staleCheck(id)) {
            return;
        }

        if (roomResult.rows.length > 0) {
            const row = roomResult.rows[0];
            const {players, galleries} = await this.fetchPlayersAndGalleries(id);

            return new Room(id, row.lobby_name, players, row.active_gallery_id, galleries);
        }
        return undefined;
    }

    private async fetchPlayersAndGalleries(id: string) {
        const playerResult = await this.client.query('SELECT player_id FROM room_player WHERE room_id = $1 ORDER BY id', [id]);
        const players =  playerResult.rows.map(row => row.player_id).reduce((u, p) => u.add(p), new Set<string>());
        const galleryResult = await this.client.query('SELECT id FROM gallery WHERE room_id = $1 ORDER BY created', [id]);
        const galleries = galleryResult.rows.map(row => row.id).reduce((u, g) => u.add(g), new Set<string>());
        return {players, galleries};
    }

    async join(p: Player, joinCode: string): Promise<Room> {
        const lobbyNameLowerCase = joinCode.toLocaleLowerCase();
        const roomResult = await this.client.query('SELECT id, active_gallery_id FROM room WHERE lobby_name = $1', [lobbyNameLowerCase]);
        let roomId;
        let activeGalleryId;
        if (roomResult.rows.length > 0) {
            roomId = roomResult.rows[0].id;
            activeGalleryId = roomResult.rows[0] || '';
            if (await this.staleCheck(roomId)) {
                roomId = uuid();
                activeGalleryId = '';
                await this.client.query('INSERT INTO room(id, lobby_name) VALUES ($1, $2)', [roomId, lobbyNameLowerCase]);
            }
        } else {
            roomId = uuid();
            activeGalleryId = '';
            await this.client.query('INSERT INTO room(id, lobby_name) VALUES ($1, $2)', [roomId, lobbyNameLowerCase]);
        }

        await this.client.query('INSERT INTO room_player(room_id, player_id) VALUES ($1, $2)', [roomId, p.id]);

        const {players, galleries} = await this.fetchPlayersAndGalleries(roomId);

        return new Room(roomId, lobbyNameLowerCase, players, activeGalleryId, galleries);
    }

    private async staleCheck(roomId: string) {
        //If all the players have been missing for longer than 10 minutes, just delete the room.
        const activeResult = await this.client.query('SELECT MIN(ROUND(DATE_PART(\'epoch\', (NOW() - p.last_seen)))) as stale FROM room_player rp JOIN player p ON rp.player_id = p.id WHERE rp.room_id = $1', [roomId]);
        let stale = activeResult.rows.length > 0 && activeResult.rows[0].stale > 600;
        if (stale) {
            await this.client.query('DELETE FROM room WHERE id = $1', [roomId]);
        }
        return stale;
    }

    async players(id: string): Promise<string[]> {
        const playerResult = await this.client.query('SELECT player_id FROM room_player WHERE room_id = $1 ORDER BY id', [id]);
        return playerResult.rows.map(row => row.player_id);
    }

}