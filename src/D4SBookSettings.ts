export class D4SBookSettings {
  bookUrl: string;
  email: string;
  password: string;

  constructor(bookUrl: string, email: string, password: string) {
    this.bookUrl = bookUrl;
    this.email = email;
    this.password = password;
  }
}
