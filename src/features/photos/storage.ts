import { createHash, createHmac } from "node:crypto";

type Method = "GET" | "PUT";

function sha256(value: Uint8Array | string) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

async function s3Request(method: Method, key: string, bytes?: Uint8Array, contentType?: string) {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKey = process.env.S3_ACCESS_KEY_ID;
  const secretKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket || !region || !accessKey || !secretKey ||
    !/^[a-z0-9.-]+$/.test(bucket) || !/^[a-z0-9-]+$/.test(region)) {
    throw new Error("S3 is not configured.");
  }

  const host = `s3.${region}.amazonaws.com`;
  const path = `/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = timestamp.slice(0, 8);
  const payloadHash = sha256(bytes ?? "");
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${timestamp}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    method, path, "", canonicalHeaders, signedHeaders, payloadHash,
  ].join("\n");
  const scope = `${date}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256", timestamp, scope, sha256(canonicalRequest),
  ].join("\n");
  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${secretKey}`, date), region), "s3"),
    "aws4_request",
  );
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const response = await fetch(`https://${host}${path}`, {
    method,
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": timestamp,
      ...(contentType ? { "Content-Type": contentType } : {}),
    },
    ...(bytes ? { body: Buffer.from(bytes) } : {}),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`S3 returned HTTP ${response.status}.`);
  return response;
}

export async function uploadPrivatePhoto(key: string, bytes: Uint8Array, contentType: string) {
  await s3Request("PUT", key, bytes, contentType);
}

export async function downloadPrivatePhoto(key: string) {
  return s3Request("GET", key);
}
