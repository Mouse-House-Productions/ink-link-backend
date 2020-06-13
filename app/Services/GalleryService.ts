import Gallery from '../Gallery/Gallery';

export default interface IGalleryService {
    createGallery: (roomId: string, bookIds: string[]) => Gallery;
    findById: (id?: string) => Gallery | undefined;
    setProgress: (id: string, active?: string, progress?: number) => void;
}
