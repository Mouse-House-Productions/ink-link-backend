import Room from "../../Room/Room";
import Player from "../../Player/Player";
import {v4 as uuid} from "uuid";
import IRoomService from "../RoomService";

export class InMemoryRoomService implements IRoomService {
    private rooms: Map<string, Room>;

    constructor() {
        this.rooms = new Map<string, Room>();
    }

    async join(p: Player, joinCode: string) {
        const lobbyName = joinCode.toLowerCase();
        let room = this.rooms.get(lobbyName);
        if (!room) {
            room = new Room(uuid(), lobbyName);
            this.rooms.set(lobbyName, room);
        }
        room.players.add(p.id);
        return room;
    }

    async players(id: string) {
        const room = await this.findById(id);
        let ret: string[] = [];
        if (room) {
            ret = [...room.players.values()];
        }
        return ret;
    }

    async findById(id: string) {
        return [...this.rooms.values()].find(r => r.id === id);
    }

    async addGallery(id: string, galleryId: string) {
        let room = [...this.rooms.values()].find(r => r.id === id);
        if (room && room.activeGalleryId === '') {
            room.galleries.add(galleryId);
            room.activeGalleryId = galleryId;
            return true;
        }
        return false;
    }


    async clearGallery(id: string) {
        let room = [...this.rooms.values()].find(r => r.id === id);
        if (room) {
            room.activeGalleryId = '';
        }
    }
}
