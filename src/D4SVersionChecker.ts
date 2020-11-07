import { JSDOM } from "jsdom";
import request from "request";

export class D4SVersionChecker {
  public static checkVersion(bookUrl: string, cookies: string, callback: Function) {
    request(
      {
        url: bookUrl + "1/1.svg",
        method: "GET",
        headers: {
          Cookie: cookies,
        },
      },
      async (err, res) => {
        if (err) return callback(null);
        const html = new JSDOM(res.body);

        const svgTags = html.window.document.getElementsByTagName("svg");
        if (svgTags.length >= 1) {
          return callback(false);
        } else {
          return callback(true);
        }
      }
    );
  }
}
