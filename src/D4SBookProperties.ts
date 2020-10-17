import { JSDOM } from "jsdom";
import request from "request";

export class D4SBookProperties {
  static getBookProperties(cookies: string, bookUrl: string, callback: Function) {
    const splitUrl = bookUrl.split("/");

    request(
      {
        url: bookUrl,
        method: "GET",
        headers: {
          Cookie: cookies,
        },
      },
      async (err, res) => {
        if (err) return callback(null);
        const html = new JSDOM(res.body);

        const metaTags = html.window.document.getElementsByTagName("meta");
        let bookName = "";
        for (var i = 0; i < metaTags.length; i++) {
          if (metaTags.item(i).getAttribute("name") == "title") {
            const unescapedName: string = metaTags.item(i).getAttribute("content");
            const splitName: string[] = unescapedName.split("/");
            if (splitName.length > 1) {
              splitName.forEach((namePart) => {
                bookName += namePart + "-";
              });
            } else {
              bookName = splitName[0];
            }
          }
        }

        const scriptTag = html.window.document.getElementsByTagName("script")[0].innerHTML;
        const splitScript = scriptTag.split("[[")[1];
        const splitScriptToValues = splitScript.split("]")[0];
        const splitToSize = splitScriptToValues.split(",");
        const bookSize: number[] = [Number(splitToSize[0]), Number(splitToSize[1])];

        return callback(splitUrl[4], splitUrl[5], bookSize, bookName);
      }
    );
  }
}
