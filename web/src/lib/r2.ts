import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "employe-screenshots";
const publicUrl = process.env.R2_PUBLIC_URL;

export const isR2Configured = Boolean(
  accountId && accessKeyId && secretAccessKey
);

export const r2Client = isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    })
  : null;

/**
 * Uploads a base64 encoded image string directly to Cloudflare R2 bucket.
 * Returns the image URL (public or signed), or null if R2 is not configured or upload fails.
 */
export async function uploadScreenshotToR2(
  base64Image: string,
  tenantId: string,
  deviceId: string
): Promise<string | null> {
  if (!isR2Configured || !r2Client || !bucketName) {
    return null;
  }

  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const filename = `screenshots/${tenantId}/${deviceId}/${Date.now()}.jpg`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: buffer,
      ContentType: "image/jpeg",
    });

    await r2Client.send(command);

    if (publicUrl) {
      const cleanPublicUrl = publicUrl.replace(/\/$/, "");
      return `${cleanPublicUrl}/${filename}`;
    }

    // Generate a long-lived pre-signed URL (7 days) if public access subdomain is not yet set
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: filename,
    });
    return await getSignedUrl(r2Client, getCommand, { expiresIn: 60 * 60 * 24 * 7 });
  } catch (error) {
    console.error("Cloudflare R2 Upload Error:", error);
    return null;
  }
}

/**
 * Extracts R2 object key from a screenshot URL
 */
export function extractR2KeyFromUrl(url: string): string | null {
  if (!url || url.startsWith("data:")) return null;
  
  // Format: https://.../screenshots/tenantId/deviceId/timestamp.jpg or /screenshots/...
  const match = url.match(/screenshots\/[^\s?#]+/);
  if (match) {
    return match[0];
  }
  return null;
}

/**
 * Batch deletes screenshots from Cloudflare R2 bucket.
 */
export async function deleteScreenshotsFromR2(keys: string[]): Promise<number> {
  if (!isR2Configured || !r2Client || !bucketName || keys.length === 0) {
    return 0;
  }

  // Filter out any invalid keys
  const validKeys = Array.from(new Set(keys.filter(Boolean)));
  if (validKeys.length === 0) return 0;

  let deletedCount = 0;
  try {
    // S3 DeleteObjectsCommand allows up to 1000 keys per batch
    for (let i = 0; i < validKeys.length; i += 1000) {
      const batch = validKeys.slice(i, i + 1000);
      const command = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: batch.map((Key) => ({ Key })),
          Quiet: true,
        },
      });
      await r2Client.send(command);
      deletedCount += batch.length;
    }
    return deletedCount;
  } catch (error) {
    console.error("Cloudflare R2 Batch Delete Error:", error);
    return deletedCount;
  }
}
