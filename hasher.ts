import bcrypt from 'bcrypt';

export class Hasher {
  readonly #saltRounds: number;

  constructor() {
    this.#saltRounds = 10;
  }

  async generateHash(plaintextPasswd: string) {
    return await bcrypt.hash(plaintextPasswd, this.#saltRounds);
  }

  async comparePass(plaintextPasswd: string, hashedPasswd: string) {
    return await bcrypt.compare(plaintextPasswd, hashedPasswd);
  }
}
