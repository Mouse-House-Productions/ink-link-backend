import Player from "../Player/Player";

export default interface IPlayerService {
    createPlayer: (playerName: string) => Promise<Player>;
    getPlayer: (playerId: string) => Promise<Player | undefined>;
    seen: (playerId: string) => Promise<void>;
    markInactive: (playerId: string) => Promise<void>;
}

