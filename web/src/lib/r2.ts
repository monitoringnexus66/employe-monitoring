import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;

export const isR2Configured = Boolean(
  accountId && accessKeyId && secretAccessKey && bucketName
);

const r2Client = isR2Configured
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
 * Returns the public image URL, or null if R2 is not configured or upload fails.
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

    return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${filename}`;
  } catch (error) {
    console.error("Cloudflare R2 Upload Error:", error);
    return null;
  }
}
