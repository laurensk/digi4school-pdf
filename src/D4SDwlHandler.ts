import { JSDOM } from "jsdom";

export class D4SDwlHandler {
  dwlSvgs: JSDOM[] = [];
  page: number = 1;
  pdfMergeNames: string[] = [];
}
