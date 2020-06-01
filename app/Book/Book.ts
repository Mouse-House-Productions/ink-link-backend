import Page, {Type} from "../Page/Page";
import Job from "../Job/Job";

class Book {
   readonly id: string;
   readonly pages: Page[];
   readonly authorId : string;
   readonly players: string[];
   readonly roomId: string;

   constructor(id: string, authorId: string, players: string[], roomId: string) {
      this.id = id;
      this.authorId = authorId;
      this.players = players;
      this.pages = [];
      this.roomId = roomId;
   }

   addPage(job: Job, contents: string) : (Job | undefined) {
      this.players.shift();
      const page = new Page(job.type, contents, job.playerId);
      this.pages.push(page);
      if (this.players.length > 0) {
         return new Job("", (job.type === Type.DEPICTION ? Type.DESCRIPTION : Type.DEPICTION), this.players[0], contents, this.id);
      }
   }

   next() : (Job | undefined) {
      const page = (this.pages.length > 0) ? this.pages[this.pages.length - 1] : undefined;
      if (this.players.length > 0) {
         const type = (page ? (page.type === Type.DEPICTION ? Type.DESCRIPTION : Type.DEPICTION) : Type.DESCRIPTION);
         const contents = page ? page.contents : '';
         return new Job("", type, this.players[0], contents, this.id);
      }
   }

   complete() {
      return this.players.length === 0;
   }


}

export default Book;