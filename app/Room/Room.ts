class Room {
    id: string
    lobbyName: string;
    players: Set<string>
    activeGalleryId : string;
    galleries : Set<string>

    constructor(id: string, lobbyName: string, players?: Set<string>, activeGalleryId?: string, galleries?: Set<string>) {
        this.id = id;
        this.lobbyName = lobbyName;
        this.players = players || new Set<string>();
        this.activeGalleryId = activeGalleryId || '';
        this.galleries = galleries || new Set<string>();
    }

}

export default Room;
