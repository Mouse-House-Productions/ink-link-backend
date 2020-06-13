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

    createPlayer(playerName: string): Player {
        const player : Player = new Player(uuid(), playerName, State.ACTIVE);
        this.players.set(player.id, player);
        this.lastSeen.set(player.id, new Date());
        return player;
    }

    getPlayer(playerId: string): Player | undefined {
        return this.players.get(playerId);
    }

    seen(playerId: string): void {
        this.lastSeen.set(playerId, new Date());
        let player = this.getPlayer(playerId);
        if (player) {
            player.state = State.ACTIVE;
        }
    }

    markInactive(playerId: string) : void {
        let player = this.getPlayer(playerId);
        if (player) {
            player.state = State.INACTIVE;
        }
    }

}
