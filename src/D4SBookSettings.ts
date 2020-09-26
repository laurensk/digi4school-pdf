import "./D4SEnv";

export class D4SBookSettings {
  bookId: number;
  bookName?: string;
  bookLastPage: number;
  bookSize: number[];
  cookies: string[];

  constructor() {
    this.bookId = Number(process.env.BOOK_ID);
    this.bookName = process.env.BOOK_NAME || null;
    this.bookLastPage = Number(process.env.BOOK_PAGES);
    this.bookSize = [Number(process.env.BOOK_PDFSIZE_W) || 595.28, Number(process.env.BOOK_PDFSIZE_H) || 841.89];
    this.cookies = [
      `ad_session_id=${process.env.COOKIE_SESSION};`,
      `digi4b=${process.env.COOKIE_DIGI4B};`,
      `digi4s=${process.env.COOKIE_DIGI4S};`,
    ];
  }
}
