import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// E6 (§12, §16): private R2 bucket, no public path. R2's S3-compatible
// endpoint requires SigV4 auth on every request regardless of bucket
// visibility settings, so an unsigned request to `rawObjectUrl()` is
// rejected by R2 itself (403) without any bucket-policy configuration —
// the signature is the only thing that makes an object reachable.
const accountId = process.env.R2_ACCOUNT_ID!;
const bucket = process.env.R2_BUCKET_NAME!;

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Gem photos and audio memos are both stored under this bucket by key —
// §16 extended the same signed-URL access control from photos to audio
// memos, since a voice recording tied to a private location is at least as
// sensitive as the photo would be.
//
// `signingDate` defaults to now and only exists so the storage test suite
// can construct a URL that is already expired relative to R2's own clock
// (rather than one merely older than this machine's clock, which can drift
// from R2's) — application code never needs to pass it.
export function signedGetUrl(key: string, expiresInSeconds = 900, signingDate?: Date): Promise<string> {
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: expiresInSeconds,
    signingDate,
  });
}

// The unsigned form of the same object's URL — never handed to a client,
// only used by tests to prove it's unreachable without a signature.
export function rawObjectUrl(key: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
}

export async function putObject(key: string, body: Buffer | Uint8Array | string, contentType: string): Promise<void> {
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
}

export async function deleteObject(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
