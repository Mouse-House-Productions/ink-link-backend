import Page from "../Page/Page";

class Book {
   id: string;
   pages: Page[];
   authorId : string;
   players: string[];
   roomId: string;

   constructor(id: string, authorId: string, players: string[], roomId: string) {
      this.id = id;
      this.authorId = authorId;
      this.players = players;
      this.pages = [];
      this.roomId = roomId;
   }

   complete() {
      return this.players.length === 0;
   }


}

export default Book;
