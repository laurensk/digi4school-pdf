import BeautifulDom from "beautiful-dom";
import request from "request";
import PDFDocument from "pdfkit";
import * as fs from "fs";
import SVGtoPDF from "svg-to-pdfkit";
import { JSDOM } from "jsdom";
import Axios from "axios";
import { D4SLog } from "./D4SLog";
import { D4SDwlHandler } from "./D4SDwlHandler";
import { D4SBookSettings } from "./D4SBookSettings";
import merge from "easy-pdf-merge";

export class D4SDownlodaer {
  bookSettings: D4SBookSettings = new D4SBookSettings();
  dwlHandler: D4SDwlHandler = new D4SDwlHandler();

  download() {
    D4SLog.welcome();
    if (
      this.bookSettings.bookId.toString().length <= 3 ||
      Object.keys(this.bookSettings.cookies).length < 1 ||
      this.bookSettings.bookLastPage <= 0 ||
      this.bookSettings.cookies[0].length < 20 ||
      this.bookSettings.cookies[1].length < 20 ||
      this.bookSettings.cookies[2].length < 20
    ) {
      D4SLog.invalidProperties();
    } else {
      this.dwlFsSetup();
      this.dwlPages(false);
    }
  }

  dwlPages(checked: boolean) {
    D4SLog.downloadPage(this.dwlHandler.page);
    let dwlUrl: string;
    if (this.bookSettings.bookIndex) {
      dwlUrl =
        "https://a.digi4school.at/ebook/" +
        this.bookSettings.bookId +
        "/" +
        this.bookSettings.bookIndex +
        "/" +
        this.dwlHandler.page +
        "/" +
        this.dwlHandler.page +
        ".svg";
    } else {
      dwlUrl =
        "https://a.digi4school.at/ebook/" +
        this.bookSettings.bookId +
        "/" +
        this.dwlHandler.page +
        "/" +
        this.dwlHandler.page +
        ".svg";
    }
    request(
      {
        url: dwlUrl,
        method: "GET",
        headers: {
          Cookie:
            this.bookSettings.cookies[0] + " " + this.bookSettings.cookies[1] + " " + this.bookSettings.cookies[2],
        },
      },
      async (err, res) => {
        if (err) return D4SLog.error();
        const html = new BeautifulDom(res.body);
        if (
          this.dwlHandler.page >= this.bookSettings.bookLastPage + 1 ||
          (this.dwlHandler.page % 50 == 0 && !checked)
        ) {
          this.dwlDone(this.dwlHandler.dwlSvgs);
        } else {
          const svg: JSDOM = await this.dwlImages(html, this.dwlHandler.page);
          this.dwlHandler.dwlSvgs.push(svg);
          this.dwlHandler.page++;
          this.dwlPages(false);
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
      let imageUrl: string;
      if (this.bookSettings.bookIndex) {
        imageUrl =
          "https://a.digi4school.at/ebook/" +
          this.bookSettings.bookId +
          "/" +
          this.bookSettings.bookIndex +
          "/" +
          page +
          "/" +
          ogHref;
      } else {
        imageUrl = "https://a.digi4school.at/ebook/" + this.bookSettings.bookId + "/" + page + "/" + ogHref;
      }
      const imageFileSystemPath: string = "book/book_images/" + this.bookSettings.bookId + "/" + page + "/" + ogHref;

      D4SLog.downloadImage(ogHref);
      fs.mkdirSync("book/book_images/" + this.bookSettings.bookId + "/" + page + "/img/", { recursive: true });
      fs.mkdirSync("book/book_images/" + this.bookSettings.bookId + "/" + page + "/shade/", { recursive: true });
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
        Cookie: this.bookSettings.cookies[0] + " " + this.bookSettings.cookies[1] + " " + this.bookSettings.cookies[2],
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
    fs.mkdirSync("book/book_images/" + this.bookSettings.bookId, { recursive: true });
    fs.mkdirSync("book/book_pdfs/" + this.bookSettings.bookId, { recursive: true });
  }

  dwlDone(svgs: JSDOM[]) {
    D4SLog.startGeneratingPages(this.dwlHandler.page - 49, this.dwlHandler.page - 1);

    const doc = new PDFDocument({
      size: this.bookSettings.bookSize,
    });

    const pdfFilePath: string = `book/book_pdfs/${this.bookSettings.bookId}/${this.bookSettings.bookId}_${
      this.dwlHandler.pdfMergeNames.length + 1
    }.pdf`;
    doc.pipe(fs.createWriteStream(pdfFilePath));
    this.dwlHandler.pdfMergeNames.push(pdfFilePath);

    for (var i = 0; i < svgs.length; i++) {
      D4SLog.generatingPage(this.dwlHandler.page - 50 + (i + 1));
      let svg = svgs[i].window.document.getElementsByTagName("svg")[0];

      svg.setAttribute("viewBox", `0 0 ${this.bookSettings.bookSize[0]} ${this.bookSettings.bookSize[1]}`);
      SVGtoPDF(doc, svg.outerHTML, 0, 0);

      if (i + 1 != svgs.length) doc.addPage();
    }
    doc.end();

    if (this.dwlHandler.page < this.bookSettings.bookLastPage) {
      this.dwlHandler.dwlSvgs = [];
      this.dwlPages(true);
    } else {
      this.mergePdfs();
    }
  }

  mergePdfs() {
    D4SLog.mergingPdfs();

    const pdfFileName: string = this.bookSettings.bookName ? this.bookSettings.bookName + ".pdf" : "book.pdf";
    const pdtFilePath: string = "book/" + pdfFileName;

    merge(this.dwlHandler.pdfMergeNames, pdtFilePath, (err) => {
      this.dwlHandler.pdfMergeNames.forEach((pdf) => {
        D4SLog.mergingPdf(pdf);
      });
      if (err) console.log(err);
      this.clearProject();
    });
  }

  clearProject() {
    D4SLog.cleaningProject();

    D4SLog.cleaningDir("book/book_pdfs");
    fs.rmdirSync("book/book_pdfs", { recursive: true });

    D4SLog.cleaningDir("book/book_images");
    fs.rmdirSync("book/book_images", { recursive: true });

    if (this.bookSettings.bookName) {
      D4SLog.downloadDone(this.bookSettings.bookName + ".pdf");
    } else {
      D4SLog.downloadDone("book.pdf");
    }
  }
}
