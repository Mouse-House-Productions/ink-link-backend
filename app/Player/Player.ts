export enum State {
    ACTIVE = "active",
    INACTIVE = "inactive"
}

class Player {
    readonly id: string;
    readonly name: string;
    state: State;

    constructor(id: string, name: string, state: State) {
        this.id = id;
        this.name = name;
        this.state = state;
    }
}

export default Player;