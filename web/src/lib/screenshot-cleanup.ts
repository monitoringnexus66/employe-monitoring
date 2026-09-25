import prisma from "@/lib/prisma";
import { deleteScreenshotsFromR2, extractR2KeyFromUrl } from "@/lib/r2";

export interface ScreenshotStats {
  totalScreenshots: number;
  expiredScreenshots: number;
  oldestScreenshotDate: string | null;
  newestScreenshotDate: string | null;
  autoDeleteScreenshots: boolean;
  screenshotRetentionDays: number;
  lastCleanupAt: string | null;
  lastDeletedCount: number;
}

/**
 * Gets live storage and retention statistics for the Super Admin dashboard
 */
export async function getScreenshotStorageStats(): Promise<ScreenshotStats> {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "global" },
  });

  const autoDelete = settings?.autoDeleteScreenshots ?? true;
  const retentionDays = settings?.screenshotRetentionDays ?? 30;
  const lastCleanupAt = settings?.lastCleanupAt ? settings.lastCleanupAt.toISOString() : null;
  const lastDeletedCount = settings?.lastDeletedCount ?? 0;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const [totalScreenshots, expiredScreenshots, oldestRecord, newestRecord] = await Promise.all([
    prisma.screenshot.count(),
    autoDelete
      ? prisma.screenshot.count({
          where: { timestamp: { lt: cutoffDate } },
        })
      : 0,
    prisma.screenshot.findFirst({
      orderBy: { timestamp: "asc" },
      select: { timestamp: true },
    }),
    prisma.screenshot.findFirst({
      orderBy: { timestamp: "desc" },
      select: { timestamp: true },
    }),
  ]);

  return {
    totalScreenshots,
    expiredScreenshots,
    oldestScreenshotDate: oldestRecord?.timestamp ? oldestRecord.timestamp.toISOString() : null,
    newestScreenshotDate: newestRecord?.timestamp ? newestRecord.timestamp.toISOString() : null,
    autoDeleteScreenshots: autoDelete,
    screenshotRetentionDays: retentionDays,
    lastCleanupAt,
    lastDeletedCount,
  };
}

/**
 * Executes cleanup of screenshots older than the configured retention period.
 * Purges both Cloudflare R2 / S3 image files and Postgres database records.
 */
export async function runScreenshotCleanup(customDays?: number): Promise<{
  deletedCount: number;
  r2DeletedCount: number;
  cutoffDate: string;
}> {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "global" },
  });

  const autoDelete = settings?.autoDeleteScreenshots ?? true;
  const retentionDays = customDays !== undefined ? customDays : (settings?.screenshotRetentionDays ?? 30);

  // If auto-delete is disabled and no customDays passed, skip
  if (!autoDelete && customDays === undefined) {
    return { deletedCount: 0, r2DeletedCount: 0, cutoffDate: new Date().toISOString() };
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  // 1. Fetch expired screenshots to collect R2 keys for deletion
  const expiredScreenshots = await prisma.screenshot.findMany({
    where: { timestamp: { lt: cutoffDate } },
    select: { id: true, s3Url: true },
    take: 5000, // Batch limit per cleanup cycle
  });

  if (expiredScreenshots.length === 0) {
    await prisma.systemSettings.upsert({
      where: { id: "global" },
      update: { lastCleanupAt: new Date(), lastDeletedCount: 0 },
      create: { id: "global", lastCleanupAt: new Date(), lastDeletedCount: 0 },
    });
    return { deletedCount: 0, r2DeletedCount: 0, cutoffDate: cutoffDate.toISOString() };
  }

  // 2. Extract R2 object keys from S3/R2 URLs
  const r2Keys: string[] = [];
  for (const item of expiredScreenshots) {
    const key = extractR2KeyFromUrl(item.s3Url);
    if (key) r2Keys.push(key);
  }

  // 3. Delete files from Cloudflare R2 / S3
  let r2DeletedCount = 0;
  if (r2Keys.length > 0) {
    r2DeletedCount = await deleteScreenshotsFromR2(r2Keys);
  }

  // 4. Delete rows from Postgres database
  const expiredIds = expiredScreenshots.map((s) => s.id);
  const deleteResult = await prisma.screenshot.deleteMany({
    where: { id: { in: expiredIds } },
  });

  const deletedCount = deleteResult.count;

  // 5. Update lastCleanupAt and lastDeletedCount in SystemSettings
  await prisma.systemSettings.upsert({
    where: { id: "global" },
    update: {
      lastCleanupAt: new Date(),
      lastDeletedCount: deletedCount,
    },
    create: {
      id: "global",
      lastCleanupAt: new Date(),
      lastDeletedCount: deletedCount,
    },
  });

  return {
    deletedCount,
    r2DeletedCount,
    cutoffDate: cutoffDate.toISOString(),
  };
}
