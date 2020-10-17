import { JSDOM } from "jsdom";
import request from "request";

export class D4SAuthHelper {
  static getCookies(email: string, password: string, bookUrl: string, callback: Function) {
    request(
      {
        url: "https://digi4school.at/br/xhr/login",
        method: "POST",
        formData: {
          email: email,
          password: password,
        },
      },
      async (err, res) => {
        if (err || res.body != "OK") return callback(null);
        const setCookies = res.headers["set-cookie"];

        const sessionCookie = setCookies[0].split(";")[0] + ";";
        const digi4sCookie = setCookies[1].split(";")[0] + ";";

        request(
          {
            url: bookUrl,
            method: "GET",
            headers: {
              Cookie: sessionCookie + " " + digi4sCookie,
            },
          },
          async (err, res) => {
            if (err) return callback(null);
            request(
              {
                url: "https://kat.digi4school.at/lti",
                method: "POST",
                headers: {
                  Cookie: sessionCookie + " " + digi4sCookie,
                },
                formData: D4SAuthHelper.getFormData(res.body),
              },
              async (err, res) => {
                if (err) return callback(null);

                request(
                  {
                    url: "https://a.digi4school.at/lti",
                    method: "POST",
                    headers: {
                      Cookie: sessionCookie + " " + digi4sCookie,
                    },
                    formData: D4SAuthHelper.getFormData(res.body),
                  },
                  async (err, res) => {
                    if (err) return callback(null);
                    const cookies = res.headers["set-cookie"];
                    cookies.forEach((cookie) => {
                      if (cookie.split("=")[0] == "digi4b") {
                        const digi4bCookie = cookie.split(";")[0] + ";";
                        const cookies = sessionCookie + " " + digi4sCookie + " " + digi4bCookie;
                        callback(cookies);
                      }
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  }

  static getFormData(html: string) {
    let formData = {};
    const form = new JSDOM(html);
    const inputArray = form.window.document.getElementsByTagName("input");
    for (var i = 0; i < inputArray.length; i++) {
      const inputField = inputArray.item(i);
      formData[inputField.getAttribute("name")] = inputField.getAttribute("value");
    }
    return formData;
  }
}
