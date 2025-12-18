import * as path from "path";
import * as fs from "fs";

export function readSecret(secretName) {
  const secretBasePath = process.env.SECRET_BASE_PATH || '/run/secrets';
  const secretPath = path.join(secretBasePath, secretName);

  if (!fs.existsSync(secretPath)) {
    throw new Error(`Secret ${secretPath} does not exist`);
  }

  const value = fs.readFileSync(secretPath, { encoding: 'utf8', flag: 'r' });
  if (!value) {
    throw new Error(`Secret ${secretPath} is empty`);
  }

  return value.trim();
}
