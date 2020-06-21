import IPlayerService from "../PlayerService";
import Player, {State} from "../../Player/Player";
import {ClientBase} from 'pg';
import {v4 as uuid} from 'uuid';

export default class PostgresPlayerService implements IPlayerService {

    private client : ClientBase;

    public constructor(client : ClientBase) {
        this.client = client;
    }

    async createPlayer(playerName: string): Promise<Player> {
        const player = new Player(uuid(), playerName, State.ACTIVE);
        await this.client.query('INSERT INTO player(id, name, state, last_seen) VALUES ($1, $2, $3, NOW())', [player.id, player.name, player.state]);
        return player;
    }

    async getPlayer(playerId: string): Promise<Player | undefined> {
        const res = await this.client.query('SELECT name, state, ROUND(DATE_PART(\'epoch\', (NOW() - last_seen))) as stale FROM player where id = $1', [playerId]);
        if (res.rows.length > 0) {
            const row = res.rows[0];
            return new Player(playerId, row.name, (row.stale > 90 ? State.INACTIVE : row.state));
        }
        return undefined;
    }

    async markInactive(playerId: string): Promise<void> {
        await this.client.query('UPDATE player SET state = \'inactive\' WHERE id = $1', [playerId]);
    }

    async seen(playerId: string): Promise<void> {
        await this.client.query('UPDATE player SET state = \'active\', last_seen = NOW() WHERE id = $1', [playerId]);
    }

}