import Player from "../Player/Player";

export default interface IPlayerService {
    createPlayer: (playerName: string) => Player;
    getPlayer: (playerId: string) => Player | undefined;
    seen: (playerId: string) => void;
    markInactive: (playerId: string) => void;
}

