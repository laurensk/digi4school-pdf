export class D4SLog {
  static welcome() {
    console.log("\nWelcome to D4S-Downloader!\n");
  }

  static invalidProperties() {
    console.log("Please specify valid book properties and cookies.\n");
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

  static startGeneratingPages(startPage: number, endPage: number) {
    console.log(`\nGenerating page ${startPage} - ${endPage}...`);
  }

  static generatingPage(page: number) {
    console.log("     Generating page " + page + "...");
  }

  static mergingPdfs() {
    console.log("\nMerging PDF's...");
  }

  static mergingPdf(pdf: string) {
    console.log("     Merging PDF " + pdf + "...");
  }

  static cleaningProject() {
    console.log("\nCleaning project...");
  }

  static cleaningDir(dir: string) {
    console.log("     Cleaning  " + dir + "...");
  }

  static downloadDone(fileName: string) {
    console.log(`\nDone! Saved as: \"${fileName}\"\nEnjoy your book!\n`);
  }
}
