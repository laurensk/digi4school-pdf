import "./D4SEnv";

export class BookSettings {
  bookId: number;
  bookLastPage: number;
  bookSize: number[];
  cookies: string[];

  constructor() {
    this.bookId = Number(process.env.BOOK_ID);
    this.bookLastPage = Number(process.env.BOOK_PAGES);
    this.bookSize = [Number(process.env.BOOK_PDFSIZE_W), Number(process.env.BOOK_PDFSIZE_H)];
    this.cookies = [
      `ad_session_id=${process.env.COOKIE_SESSION};`,
      `digi4b=${process.env.COOKIE_DIGI4B};`,
      `digi4s=${process.env.COOKIE_DIGI4S};`,
    ];
  }
}
