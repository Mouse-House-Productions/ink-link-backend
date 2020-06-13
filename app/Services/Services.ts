import IJobService from "./JobService";
import IGalleryService from "./GalleryService";
import IBookService from "./BookService";
import IPlayerService from "./PlayerService";
import IRoomService from "./RoomService";

export interface Services {
    jobService: IJobService;
    galleryService: IGalleryService;
    bookService: IBookService;
    playerService: IPlayerService;
    roomService: IRoomService;
}

export default interface ServicesProvider<T> {
    services : (t : T) => Services;
}
