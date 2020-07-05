import {Registry} from "prom-client";

export default interface IMetricsService {
    player: () => void;
    picture: () => void;
    description: () => void;
    room: () => void;
    gallery: (playerCount: number) => void;
    jobSkip: () => void;
    download: () => void;
    leave: () => void;
    metrics: () => Registry;
}