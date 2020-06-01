import Room from "./Room";
import Player from "../Player/Player";
import {v4 as uuid} from 'uuid';

export interface IRoomService {
    join: (p: Player, joinCode: string) => Room;
    findById: (id: string) => Room | undefined;
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
        room.addPlayer(p.id);
        return room;
    }

    findById(id: string) {
        return [...this.rooms.values()].find(r => r.id === id);
    }
}