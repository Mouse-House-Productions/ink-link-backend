import IJobService from "./JobService";
import IGalleryService from "./GalleryService";
import IBookService from "./BookService";
import IPlayerService from "./PlayerService";
import IRoomService from "./RoomService";
import IMetricsService from "./MetricsService";

export interface Services {
    jobService: IJobService;
    galleryService: IGalleryService;
    bookService: IBookService;
    playerService: IPlayerService;
    roomService: IRoomService;
    metricsService: IMetricsService;
}

export default interface ServicesProvider<T> {
    services : (t : T) => Services;
}
