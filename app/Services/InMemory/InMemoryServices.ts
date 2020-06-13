import ServicesProvider, {Services} from "../Services";
import InMemoryBookService from "./InMemoryBookService";
import InMemoryJobService from "./InMemoryJobService";
import {InMemoryRoomService} from "./InMemoryRoomService";
import {InMemoryGalleryService} from "./InMemoryGalleryService";
import InMemoryPlayerService from "./InMemoryPlayerService";

export default class InMemoryServices implements ServicesProvider<void> {

    s : Services;

    constructor() {
        this.s = {
            bookService: new InMemoryBookService(),
            jobService: new InMemoryJobService(),
            roomService: new InMemoryRoomService(),
            galleryService: new InMemoryGalleryService(),
            playerService: new InMemoryPlayerService()
        }
    }

    services() {
        return this.s;
    }

}