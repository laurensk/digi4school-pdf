import { JSDOM } from "jsdom";

export class D4SDwlHandler {
  cookies: string = "";
  bookId: string = "";
  bookIndex: string = "";
  bookSize: number[] = [];
  bookName: string = "";

  isDoneDownloading: boolean = false;

  dwlSvgs: JSDOM[] = [];
  page: number = 1;
  pdfMergeNames: string[] = [];
}
