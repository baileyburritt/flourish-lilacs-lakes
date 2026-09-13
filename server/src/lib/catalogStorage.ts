import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// E10 (§03, §06): a second, *public* R2 bucket — deliberately separate from
// storage.ts's private gem bucket, so a catalog-scoped credential can never
// reach a private gem object and vice versa. Destination/event photography
// isn't sensitive the way a gem photo or audio memo is (§12), so objects
// here are served straight from the bucket's public URL rather than through
// a signed, expiring one.
const accountId = process.env.R2_ACCOUNT_ID!;
const bucket = process.env.R2_CATALOG_BUCKET_NAME!;
// The bucket's own public URL base — either its R2.dev "Public Development
// URL" or a custom domain put in front of it — set once by whoever turns on
// public access for this bucket. No trailing slash.
const publicBaseUrl = process.env.R2_CATALOG_PUBLIC_BASE_URL!;

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_CATALOG_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_CATALOG_SECRET_ACCESS_KEY!,
  },
});

export function publicUrl(key: string): string {
  return `${publicBaseUrl}/${key}`;
}

export async function putCatalogImage(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string> {
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
  return publicUrl(key);
}

export async function deleteCatalogImage(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
