import Player, {State} from "../../Player/Player";
import {v4 as uuid} from "uuid";
import IPlayerService from "../PlayerService";

export default class InMemoryPlayerService implements IPlayerService {

    private players: Map<string, Player>;
    private lastSeen : Map<string, Date>;

    constructor() {
        this.players = new Map<string, Player>();
        this.lastSeen = new Map<string, Date>();
        setInterval(() => {
            const now = new Date();
            [...this.players.values()].forEach(p => {
                let playerLastSeen = this.lastSeen.get(p.id);
                if (!playerLastSeen || (((now.getTime() - playerLastSeen.getTime())) > 90000) ) {
                    p.state = State.INACTIVE;
                }
            });
        }, 1000);
    }

    async createPlayer(playerName: string) {
        const player : Player = new Player(uuid(), playerName, State.ACTIVE);
        this.players.set(player.id, player);
        this.lastSeen.set(player.id, new Date());
        return player;
    }

    async getPlayer(playerId: string) {
        return this.players.get(playerId);
    }

    async seen(playerId: string) {
        this.lastSeen.set(playerId, new Date());
        this.getPlayer(playerId).then(p => {
            if (p) {p.state = State.ACTIVE}
        });
    }

    async markInactive(playerId: string) {
        let player = this.getPlayer(playerId);
        this.getPlayer(playerId).then(p => {
            if (p) {p.state = State.INACTIVE}
        });
    }

}
