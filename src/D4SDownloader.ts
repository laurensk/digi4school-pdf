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
import { D4SBookProperties } from "./D4SBookProperties";
import readline from "readline";
import { D4SAuthHelper } from "./D4SAuthHelper";
import { D4SVersionChecker } from "./D4SVersionChecker";

export class D4SDownlodaer {
  bookSettings: D4SBookSettings;
  dwlHandler: D4SDwlHandler = new D4SDwlHandler();

  async startDownload() {
    D4SLog.welcome();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Paste the URL of your book: ", (bookUrl) => {
      rl.question("Username/Email: ", (email) => {
        rl.question("Password: ", (password) => {
          rl.write("\n");
          this.bookSettings = new D4SBookSettings(bookUrl, email, password);
          rl.close();
          this.download();
        });
      });
    });
  }

  async download() {
    if (
      this.bookSettings.bookUrl.length < 30 ||
      this.bookSettings.email.length <= 0 ||
      this.bookSettings.password.length <= 0
    ) {
      return D4SLog.invalidProperties();
    }

    D4SAuthHelper.getCookies(
      this.bookSettings.email,
      this.bookSettings.password,
      this.bookSettings.bookUrl,
      (cookies) => {
        if (!cookies) return D4SLog.invalidProperties();
        this.dwlHandler.cookies = cookies;

        D4SBookProperties.getBookProperties(
          this.dwlHandler.cookies,
          this.bookSettings.bookUrl,
          (bookId: string, bookIndex: string, bookSize: number[], bookName: string) => {
            this.dwlHandler.bookId = bookId;
            this.dwlHandler.bookIndex = bookIndex;
            this.dwlHandler.bookSize = bookSize;
            this.dwlHandler.bookName = bookName;

            let bookUrl: string = "";
            if (this.dwlHandler.bookIndex) {
              if (this.dwlHandler.bookIndex.length != 0) {
                bookUrl =
                  "https://a.digi4school.at/ebook/" + this.dwlHandler.bookId + "/" + this.dwlHandler.bookIndex + "/";
              } else {
                bookUrl = "https://a.digi4school.at/ebook/" + this.dwlHandler.bookId + "/";
              }
            } else {
              bookUrl = "https://a.digi4school.at/ebook/" + this.dwlHandler.bookId + "/";
            }

            D4SVersionChecker.checkVersion(bookUrl, this.dwlHandler.cookies, (isNewVersion: boolean) => {
              this.dwlHandler.isNewVersion = isNewVersion;

              this.dwlFsSetup();
              this.dwlPages(false);
            });
          }
        );
      }
    );
  }

  dwlPages(checked: boolean) {
    D4SLog.downloadPage(this.dwlHandler.page);
    let dwlUrl: string;
    if (this.dwlHandler.bookIndex) {
      if (this.dwlHandler.bookIndex.length != 0) {
        dwlUrl =
          "https://a.digi4school.at/ebook/" +
          this.dwlHandler.bookId +
          "/" +
          this.dwlHandler.bookIndex +
          "/" +
          this.dwlHandler.page +
          "/" +
          this.dwlHandler.page +
          ".svg";
      } else {
        dwlUrl =
          "https://a.digi4school.at/ebook/" +
          this.dwlHandler.bookId +
          "/" +
          this.dwlHandler.page +
          "/" +
          this.dwlHandler.page +
          ".svg";
      }
    } else {
      //dwlUrl = "https://a.digi4school.at/ebook/" + this.dwlHandler.bookId + "/" + this.dwlHandler.page + ".svg";
      dwlUrl =
        "https://a.digi4school.at/ebook/" +
        this.dwlHandler.bookId +
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
          Cookie: this.dwlHandler.cookies,
        },
      },
      async (err, res) => {
        if (err) D4SLog.error();
        const html = new BeautifulDom(res.body);
        if (html.getElementsByTagName("svg").length <= 0) {
          this.dwlHandler.isDoneDownloading = true;
          this.dwlDone(this.dwlHandler.dwlSvgs);
          return;
        }
        if (this.dwlHandler.page % 50 == 0 && !checked) {
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
      if (this.dwlHandler.bookIndex) {
        imageUrl =
          "https://a.digi4school.at/ebook/" +
          this.dwlHandler.bookId +
          "/" +
          this.dwlHandler.bookIndex +
          "/" +
          page +
          "/" +
          ogHref;
      } else {
        //imageUrl = "https://a.digi4school.at/ebook/" + this.dwlHandler.bookId + "/" + ogHref;
        imageUrl = "https://a.digi4school.at/ebook/" + this.dwlHandler.bookId + "/" + page + "/" + ogHref;
      }
      //const imageFileSystemPath: string = "book/book_images/" + this.dwlHandler.bookId + "/" + ogHref;
      const imageFileSystemPath: string = "book/book_images/" + this.dwlHandler.bookId + "/" + page + "/" + ogHref;

      D4SLog.downloadImage(ogHref);
      fs.mkdirSync("book/book_images/" + this.dwlHandler.bookId + "/" + page + "/img/", { recursive: true });
      fs.mkdirSync("book/book_images/" + this.dwlHandler.bookId + "/" + page + "/shade/", { recursive: true });
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
        Cookie: this.dwlHandler.cookies,
      },
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  }

  dwlFsSetup() {
    if (!fs.existsSync("book/")) fs.mkdirSync("book");
    if (fs.existsSync("book/book_images/")) fs.rmdirSync("book/book_images/", { recursive: true });
    if (fs.existsSync("book/book_pdfs/")) fs.rmdirSync("book/book_pdfs/", { recursive: true });
    fs.mkdirSync("book/book_images/" + this.dwlHandler.bookId, { recursive: true });
    fs.mkdirSync("book/book_pdfs/" + this.dwlHandler.bookId, { recursive: true });
  }

  dwlDone(svgs: JSDOM[]) {
    D4SLog.startGeneratingPages(this.dwlHandler.page - 49, this.dwlHandler.page - 1);

    const doc = new PDFDocument({
      size: this.dwlHandler.bookSize,
    });

    const pdfFilePath: string = `book/book_pdfs/${this.dwlHandler.bookId}/${this.dwlHandler.bookId}_${
      this.dwlHandler.pdfMergeNames.length + 1
    }.pdf`;
    doc.pipe(fs.createWriteStream(pdfFilePath));
    this.dwlHandler.pdfMergeNames.push(pdfFilePath);

    for (var i = 0; i < svgs.length; i++) {
      D4SLog.generatingPage(this.dwlHandler.page - 50 + (i + 1));
      let svg = svgs[i].window.document.getElementsByTagName("svg")[0];

      svg.setAttribute("viewBox", `0 0 ${this.dwlHandler.bookSize[0]} ${this.dwlHandler.bookSize[1]}`);
      try {
        SVGtoPDF(doc, svg.outerHTML, 0, 0);
      } catch {}

      if (i + 1 != svgs.length) doc.addPage();
    }
    doc.end();

    if (!this.dwlHandler.isDoneDownloading) {
      this.dwlHandler.dwlSvgs = [];
      this.dwlPages(true);
    } else {
      this.mergePdfs();
    }
  }

  mergePdfs() {
    D4SLog.mergingPdfs();

    const pdfFileName: string = this.dwlHandler.bookName ? this.dwlHandler.bookName + ".pdf" : "book.pdf";
    const pdtFilePath: string = "book/" + pdfFileName;

    this.dwlHandler.pdfMergeNames.forEach((pdf) => {
      D4SLog.mergingPdf(pdf);
    });

    merge(this.dwlHandler.pdfMergeNames, pdtFilePath, (err) => {
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

    if (this.dwlHandler.bookName) {
      D4SLog.downloadDone(this.dwlHandler.bookName + ".pdf");
    } else {
      D4SLog.downloadDone("book.pdf");
    }
  }
}
