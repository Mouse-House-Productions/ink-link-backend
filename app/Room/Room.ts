class Room {
    readonly id: string
    readonly lobbyName: string;
    private players: Set<string>
    activeGalleryId : string;
    galleries : Set<string>

    constructor(id: string, lobbyName: string) {
        this.id = id;
        this.lobbyName = lobbyName;
        this.players = new Set<string>();
        this.activeGalleryId = '';
        this.galleries = new Set<string>();
    }

    public addPlayer(p: string) : void {
        this.players.add(p);
    }

    public getPlayers() : string[] {
        return [...this.players.values()];
    }

}

export default Room;