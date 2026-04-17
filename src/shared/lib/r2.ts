import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getServerEnv } from '@/shared/lib/env';

type R2Config = {
  bucket: string;
  client: S3Client;
};

let cached: R2Config | null = null;

function buildEndpoint(accountId: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

/**
 * Lazy-initialized R2 client. R2 is S3-compatible; we use the AWS SDK with a
 * Cloudflare endpoint and force-path-style addressing (bucket in URL path).
 *
 * Throws when any required env var is missing — never silently fall back, so
 * misconfiguration is loud at first use rather than at random later requests.
 */
function getR2(): R2Config {
  if (cached) return cached;
  const env = getServerEnv();
  const accountId = env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = env.R2_BUCKET_NAME?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      'R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.',
    );
  }
  const client = new S3Client({
    region: 'auto',
    endpoint: buildEndpoint(accountId),
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
  cached = { bucket, client };
  return cached;
}

export type PutAttachmentObjectInput = {
  key: string;
  body: Uint8Array;
  contentType: string;
};

export async function putAttachmentObject({
  key,
  body,
  contentType,
}: PutAttachmentObjectInput): Promise<void> {
  const { bucket, client } = getR2();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/** Streams the object body fully into memory; OK for our 1 MB attachment cap. */
export async function getAttachmentObject(key: string): Promise<Uint8Array> {
  const { bucket, client } = getR2();
  const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = result.Body;
  if (!body) {
    throw new Error('R2 object has empty body');
  }
  const bytes = await body.transformToByteArray();
  return bytes;
}

export async function deleteAttachmentObject(key: string): Promise<void> {
  const { bucket, client } = getR2();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/**
 * Builds a stable, sanitized object key. The leading `projects/<projectId>` prefix
 * lets us scope IAM policies (and bulk-delete on project removal) per project.
 */
export function buildAttachmentObjectKey(params: {
  projectId: string;
  attachmentId: string;
  filename: string;
}): string {
  const safe = params.filename.replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 120);
  return `projects/${params.projectId}/attachments/${params.attachmentId}/${safe}`;
}
