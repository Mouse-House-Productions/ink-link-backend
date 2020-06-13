class Room {
    id: string
    lobbyName: string;
    players: Set<string>
    activeGalleryId : string;
    galleries : Set<string>

    constructor(id: string, lobbyName: string) {
        this.id = id;
        this.lobbyName = lobbyName;
        this.players = new Set<string>();
        this.activeGalleryId = '';
        this.galleries = new Set<string>();
    }
}

export default Room;
