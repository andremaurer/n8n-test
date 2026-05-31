import crypto from "crypto";

// SHA-256 hex (matches Web Crypto used in middleware) for the password gate.
export function sha256Hex(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

// AES-256-GCM for password-protected backups (at-rest option).
export function encryptJson(plaintext: string, passphrase: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(passphrase, salt, 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    _enc: "aes-256-gcm",
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: enc.toString("base64"),
  });
}

export function decryptJson(payload: string, passphrase: string): string {
  const o = JSON.parse(payload);
  const key = crypto.scryptSync(passphrase, Buffer.from(o.salt, "base64"), 32);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(o.iv, "base64"));
  decipher.setAuthTag(Buffer.from(o.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(o.data, "base64")), decipher.final()]).toString("utf8");
}
