import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export class HashUtil {
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
