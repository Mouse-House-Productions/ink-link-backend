import Gallery from '../Gallery/Gallery';

export default interface IGalleryService {
    createGallery: (roomId: string, bookIds: string[]) => Promise<Gallery>;
    findById: (id?: string) => Promise<Gallery | undefined>;
    setProgress: (id: string, active?: string, progress?: number) => Promise<void>;
}
