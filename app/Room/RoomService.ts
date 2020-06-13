import Room from "./Room";
import Player from "../Player/Player";
import {v4 as uuid} from 'uuid';

export interface IRoomService {
    join: (p: Player, joinCode: string) => Room;
    findById: (id: string) => Room | undefined;
    addGallery: (id: string, galleryId: string) => boolean;
    clearGallery: (id: string) => void;
    players: (id: string) => Player[];
}

export class InMemoryRoomService implements IRoomService {
    private rooms: Map<string, Room>;

    constructor() {
        this.rooms = new Map<string, Room>();
    }

    join(p: Player, joinCode: string) {
        const lobbyName = joinCode.toLowerCase();
        let room = this.rooms.get(lobbyName);
        if (!room) {
            room = new Room(uuid(), lobbyName);
            this.rooms.set(lobbyName, room);
        }
        room.players.add(p.id);
        return room;
    }

    players(id: string) {
        const room = this.findById(id);
        if (room) {
            return [...room.players.values()];
        }
        return [];
    }

    findById(id: string) {
        return [...this.rooms.values()].find(r => r.id === id);
    }

    addGallery(id: string, galleryId: string) {
        let room = [...this.rooms.values()].find(r => r.id === id);
        if (room && room.activeGalleryId === '') {
            room.galleries.add(galleryId);
            room.activeGalleryId = galleryId;
            return true;
        }
        return false;
    }


    clearGallery(id: string) {
        let room = [...this.rooms.values()].find(r => r.id === id);
        if (room) {
            room.activeGalleryId = '';
        }
    }
}
