import BeautifulDom from "beautiful-dom";
import request from "request";
import PDFDocument from "pdfkit";
import * as fs from "fs";
import SVGtoPDF from "svg-to-pdfkit";

const bookId: number = 2362;
const bookLastPage: number = 340;
const cookies: string[] = [
  "ad_session_id=1868656527%2c0%2c0%2c1601063825%20{351%201601065025%200BF1F57A062F29D6C2FFAB0DF8B328D98848F21D};",
  "digi4b=1867916977%2c2362%2c105o53xfy6fz%2c78233%20{66%201601111347%2066D7D4BFA4BAFCE7D21A3B2C1CA808C04346390D};",
  "digi4s=78233%2c1601024944%20{170%200%20E0433081BCB8CDF28ED1B481FC15FB2A85E7487C};",
];

let dwlSvg: BeautifulDom[] = [];
let page = 1;

if (bookId.toString().length <= 3 || Object.keys(cookies).length < 1) {
  console.log("Please specify valid book number and cookies.");
} else {
  dwlHandler(bookId, cookies);
}

function dwlHandler(bookId: number, cookies: object) {
  request(
    {
      url: "https://a.digi4school.at/ebook/" + bookId + "/" + page + "/" + page + ".svg",
      method: "GET",
      headers: {
        Cookie: cookies[0] + " " + cookies[1] + " " + cookies[2],
      },
    },
    function (err, res) {
      if (err) return dwlErrorLog();
      const html = new BeautifulDom(res.body);
      if (page >= bookLastPage) {
        dwlDone(dwlSvg);
      } else {
        dwlLog(page);
        dwlSvg.push(html);
        page++;
        dwlHandler(bookId, cookies);
      }
    }
  );
}

function dwlDone(dwlSvg: BeautifulDom[]) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream("book.pdf"));
  dwlSvg.forEach((svg) => {
    SVGtoPDF(doc, svg.getElementsByTagName("svg")[0].outerHTML.toString(), 0, 0);
    doc.addPage();
  });
  doc.end();
  dwlPDFDoneLog();
}

function dwlErrorLog() {
  console.log("An unknown error occured. Please try again later.");
}

function dwlLog(page: number) {
  console.log("Downloading page " + page + "...");
}

function dwlDoneLog() {
  console.log("Download finished. Generating PDF...");
}

function dwlPDFDoneLog() {
  console.log("Done! Enjoy your book!");
}
