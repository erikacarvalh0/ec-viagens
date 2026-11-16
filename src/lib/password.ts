import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [salt, expectedHex, ...extra] = storedHash.split(":");

  if (!salt || !expectedHex || extra.length > 0) {
    return false;
  }

  if (!/^[a-f0-9]{32}$/i.test(salt) || !/^[a-f0-9]{128}$/i.test(expectedHex)) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");

  if (expected.length !== KEY_LENGTH) {
    return false;
  }

  const actual = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  return timingSafeEqual(actual, expected);
}
