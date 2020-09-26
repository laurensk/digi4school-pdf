export class D4SLog {
  static invalidProperties() {
    console.log("Please specify valid book number and cookies.");
  }

  static error() {
    console.log("\nAn unknown error occured. Please try again later.\n");
  }

  static downloadPage(page: number) {
    console.log("\nDownloading page " + page + "...");
  }

  static downloadImage(imageHref: string) {
    console.log("     Downloading image " + imageHref + "...");
  }

  static pageDownloadDone() {
    console.log("\nDownload finished. Generating PDF...\n");
  }

  static appendingPage(page: number) {
    console.log("Appending page " + page + "...");
  }

  static downloadDone() {
    console.log("\nDone! Enjoy your book!\n");
  }
}
