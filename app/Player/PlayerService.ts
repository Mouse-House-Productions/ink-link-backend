import Player from "./Player";
import {v4 as uuid} from 'uuid';

export interface IPlayerService {
    createPlayer: (playerName: string) => Player;
    getPlayer: (playerId: string) => Player | undefined;
}

export class InMemoryPlayerService implements IPlayerService {

    private players: Map<string, Player>;

    constructor() {
        this.players = new Map<string, Player>();
    }

    createPlayer(playerName: string): Player {
        const player : Player = new Player(uuid(), playerName);
        this.players.set(player.id, player);
        return player;
    }

    getPlayer(playerId: string): Player | undefined {
        return this.players.get(playerId);
    }

}