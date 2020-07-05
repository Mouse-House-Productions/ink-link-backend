import ServicesProvider, {Services} from "../Services";
import {ClientBase} from "pg";
import PostgresBookService from "./PostgresBookService";
import PostgresPlayerService from "./PostgresPlayerService";
import PostgresJobService from "./PostgresJobService";
import PostgresGalleryService from "./PostgresGalleryService";
import PostgresRoomService from "./PostgresRoomService";
import IMetricsService from "../MetricsService";
import InMemoryMetricsService from "../InMemory/InMemoryMetricsService";

export default class PostgresServices implements ServicesProvider<ClientBase> {

    private readonly metricsService : IMetricsService;

    constructor() {
        this.metricsService = new InMemoryMetricsService();
    }

    services(t: ClientBase): Services {
        return {
            bookService: new PostgresBookService(t),
            playerService: new PostgresPlayerService(t),
            jobService: new PostgresJobService(t),
            galleryService: new PostgresGalleryService(t),
            roomService: new PostgresRoomService(t),
            metricsService: this.metricsService,
        };
    }

}