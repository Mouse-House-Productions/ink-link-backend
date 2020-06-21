import Room from "../Room/Room";
import Player from "../Player/Player";

export default interface IRoomService {
    join: (p: Player, joinCode: string) => Promise<Room>;
    findById: (id: string) => Promise<Room | undefined>;
    addGallery: (id: string, galleryId: string) => Promise<boolean>;
    clearGallery: (id: string, galleryId: string) => Promise<void>;
    players: (id: string) => Promise<string[]>;
}