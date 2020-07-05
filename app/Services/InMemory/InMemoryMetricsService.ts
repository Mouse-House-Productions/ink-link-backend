import IMetricsService from "../MetricsService";
import {Counter, register, Registry} from "prom-client";

export default class InMemoryMetricsService implements IMetricsService {

    private readonly descriptionCounter : Counter<string>;
    private readonly downloadCounter : Counter<string>;
    private readonly galleryCounter : Counter<string>;
    private readonly jobSkipCounter : Counter<string>;
    private readonly pictureCounter : Counter<string>;
    private readonly leaveCounter : Counter<string>;
    private readonly roomCounter : Counter<string>;
    private readonly playerCounter : Counter<string>;

    constructor() {
        this.descriptionCounter = new Counter<string>({
            name: "descriptions",
            help: "Count of descriptions submitted",
        });
        register.registerMetric(this.descriptionCounter);

        this.downloadCounter = new Counter<string>({
            name: "downloads",
            help: "Count of downloads requested",
        });
        register.registerMetric(this.downloadCounter);

        this.galleryCounter = new Counter<string>({
            name: "galleries",
            help: "Count of galleries created",
            labelNames: ["size"]
        });
        register.registerMetric(this.galleryCounter);

        this.jobSkipCounter = new Counter<string>({
            name: "job_skip",
            help: "Number of jobs skipped for inactive players",
        });
        register.registerMetric(this.jobSkipCounter);

        this.pictureCounter = new Counter<string>({
            name: "pictures",
            help: "Number of pictures submitted",
        });
        register.registerMetric(this.pictureCounter);

        this.leaveCounter = new Counter<string>({
            name: "leave",
            help: "Number of times players actively left a lobby",
        });
        register.registerMetric(this.leaveCounter);

        this.playerCounter = new Counter<string>({
            name: "player",
            help: "Number of players created",
        });
        register.registerMetric(this.playerCounter);

        this.roomCounter = new Counter<string>({
            name: "room",
            help: "Number of rooms created",
        });
        register.registerMetric(this.roomCounter);
    }

    description(): void {
        this.descriptionCounter.inc();
    }

    download(): void {
        this.downloadCounter.inc();
    }

    gallery(playerCount: number): void {
        this.galleryCounter.labels(playerCount.toString()).inc();
    }

    jobSkip(): void {
        this.jobSkipCounter.inc();
    }

    picture(): void {
        this.pictureCounter.inc();
    }

    player(): void {
        this.playerCounter.inc();
    }

    room(): void {
        this.roomCounter.inc();
    }

    leave() : void {
        this.leaveCounter.inc();
    }

    metrics(): Registry {
        return register;
    }

}