import BeautifulDom from "beautiful-dom";
import request from "request";
import PDFDocument from "pdfkit";
import * as fs from "fs";
import SVGtoPDF from "svg-to-pdfkit";
import { JSDOM } from "jsdom";
import Axios from "axios";
import { D4SLog } from "./D4SLog";
import { D4SDwlHandler } from "./D4SDwlHandler";
import { BookSettings } from "./BookSettings";

export class D4SDownlodaer {
  BookSettings: BookSettings = new BookSettings();
  D4SDwlHandler: D4SDwlHandler = new D4SDwlHandler();

  download() {
    D4SLog.welcome();
    if (
      this.BookSettings.bookId.toString().length <= 3 ||
      Object.keys(this.BookSettings.cookies).length < 1 ||
      this.BookSettings.bookLastPage <= 0 ||
      this.BookSettings.cookies[0].length < 20 ||
      this.BookSettings.cookies[1].length < 20 ||
      this.BookSettings.cookies[2].length < 20
    ) {
      D4SLog.invalidProperties();
    } else {
      this.dwlFsSetup();
      this.dwlPages(this.BookSettings.bookId, this.BookSettings.cookies);
    }
  }

  dwlPages(bookId: number, cookies: object) {
    request(
      {
        url:
          "https://a.digi4school.at/ebook/" +
          bookId +
          "/" +
          this.D4SDwlHandler.page +
          "/" +
          this.D4SDwlHandler.page +
          ".svg",
        method: "GET",
        headers: {
          Cookie: cookies[0] + " " + cookies[1] + " " + cookies[2],
        },
      },
      async (err, res) => {
        if (err) return D4SLog.error();
        const html = new BeautifulDom(res.body);
        if (this.D4SDwlHandler.page >= this.BookSettings.bookLastPage) {
          this.dwlDone(this.D4SDwlHandler.dwlSvgs);
        } else {
          D4SLog.downloadPage(this.D4SDwlHandler.page);
          const svg: JSDOM = await this.dwlImages(html, this.D4SDwlHandler.page);
          this.D4SDwlHandler.dwlSvgs.push(svg);
          this.D4SDwlHandler.page++;
          this.dwlPages(bookId, cookies);
        }
      }
    );
  }

  async dwlImages(html: BeautifulDom, page: number) {
    const dwlSvg: string = html.getElementsByTagName("svg")[0].outerHTML.toString();
    let svg = new JSDOM(dwlSvg);

    let imageNodes = svg.window.document.getElementsByTagName("image");
    for (var i = 0; i < imageNodes.length; i++) {
      const ogHref: string = imageNodes.item(i).getAttribute("xlink:href");
      const imageUrl: string = "https://a.digi4school.at/ebook/" + this.BookSettings.bookId + "/" + page + "/" + ogHref;
      const imageFileSystemPath: string = "book/book_images/" + this.BookSettings.bookId + "/" + page + "/" + ogHref;

      D4SLog.downloadImage(ogHref);
      fs.mkdirSync("book/book_images/" + this.BookSettings.bookId + "/" + page + "/img/", { recursive: true });
      fs.mkdirSync("book/book_images/" + this.BookSettings.bookId + "/" + page + "/shade/", { recursive: true });
      await this.dwlImage(imageUrl, imageFileSystemPath);

      imageNodes.item(i).setAttribute("xlink:href", imageFileSystemPath);
    }

    return svg;
  }

  async dwlImage(imageUrl: string, fileSystemPath: string) {
    const writer = fs.createWriteStream(fileSystemPath);

    const response = await Axios(imageUrl, {
      method: "GET",
      responseType: "stream",
      headers: {
        Cookie: this.BookSettings.cookies[0] + " " + this.BookSettings.cookies[1] + " " + this.BookSettings.cookies[2],
      },
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  }

  dwlFsSetup() {
    if (fs.existsSync("book/")) fs.rmdirSync("book", { recursive: true });
    fs.mkdirSync("book");
    fs.mkdirSync("book/book_images/" + this.BookSettings.bookId, { recursive: true });
  }

  dwlDone(svgs: JSDOM[]) {
    D4SLog.pageDownloadDone();
    const doc = new PDFDocument({
      size: this.BookSettings.bookSize,
    });
    doc.pipe(fs.createWriteStream("book/book.pdf"));
    for (var i = 0; i < svgs.length; i++) {
      D4SLog.appendingPage(i + 1);
      SVGtoPDF(doc, svgs[i].window.document.getElementsByTagName("svg")[0].outerHTML, 0, 0);
      doc.addPage();
    }
    doc.end();
    D4SLog.downloadDone();
  }
}
