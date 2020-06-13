import Room from "../Room/Room";
import Player from "../Player/Player";

export default interface IRoomService {
    join: (p: Player, joinCode: string) => Room;
    findById: (id: string) => Room | undefined;
    addGallery: (id: string, galleryId: string) => boolean;
    clearGallery: (id: string) => void;
    players: (id: string) => string[];
}