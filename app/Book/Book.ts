import Page from "../Page/Page";

class Book {
   id: string;
   pages: Page[];
   authorId : string;
   players: string[];

   constructor(id: string, authorId: string, players: string[], pages?: Page[]) {
      this.id = id;
      this.authorId = authorId;
      this.players = players;
      this.pages = pages || [];
   }

   complete() {
      return this.players.length === 0;
   }


}

export default Book;
