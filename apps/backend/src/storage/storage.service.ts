import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import "multer";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly publicUrl: string;
  private readonly localBaseUrl: string;
  private readonly uploadsDir: string;
  private readonly accountId: string;
  private readonly isPlaceholder: boolean;

  constructor(private readonly config: ConfigService) {
    this.accountId = this.config.get<string>("R2_ACCOUNT_ID", "placeholder_account_id");
    const accessKeyId = this.config.get<string>("R2_ACCESS_KEY_ID", "placeholder_access_key");
    const secretAccessKey = this.config.get<string>("R2_SECRET_ACCESS_KEY", "placeholder_secret_key");
    this.bucketName = this.config.get<string>("R2_BUCKET_NAME", "workmate");
    this.publicUrl = this.config
      .get<string>("R2_PUBLIC_URL", "https://pub-workmate.r2.dev")
      .replace(/\/+$/, "");
    this.localBaseUrl = this.config
      .get<string>("LOCAL_STORAGE_BASE_URL", "http://localhost:4000")
      .replace(/\/+$/, "");
    this.uploadsDir = path.resolve(
      process.cwd(),
      this.config.get<string>("UPLOADS_DIR", "./uploads"),
    );

    this.isPlaceholder =
      !accessKeyId ||
      !secretAccessKey ||
      !this.accountId ||
      accessKeyId.includes("placeholder") ||
      secretAccessKey.includes("placeholder") ||
      this.accountId.includes("placeholder");

    if (this.isPlaceholder) {
      this.logger.warn(
        "Cloudflare R2 credentials are set to placeholder values. File uploads will simulate storage and return mock URLs.",
      );
    } else {
      this.s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log(`Cloudflare R2 client initialized for bucket: ${this.bucketName}`);
    }
  }

  validateImage(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type "${file.mimetype}". Allowed types: image/jpeg, image/png, image/webp, image/gif`,
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException(
        `File size exceeds the limit of ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB`,
      );
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = "posts",
  ): Promise<string> {
    this.validateImage(file);

    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const key = `${folder}/${randomUUID()}${ext}`;

    if (this.isPlaceholder || !this.s3Client) {
      const filePath = path.resolve(this.uploadsDir, key);
      try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, file.buffer);
      } catch (err) {
        this.logger.error(
          `Failed to save uploaded file locally: ${err instanceof Error ? err.message : String(err)}`,
        );
        throw new InternalServerErrorException("Failed to store uploaded file");
      }

      this.logger.log(
        `[Local fallback] Stored "${file.originalname}" (${file.size} bytes) at ${filePath}`,
      );
      return `${this.localBaseUrl}/uploads/${key}`;
    }

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      this.logger.log(
        `Uploaded "${file.originalname}" to Cloudflare R2: ${key}`,
      );
      return key;
    } catch (error) {
      this.logger.error(
        `Failed to upload image to Cloudflare R2: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        "Failed to upload image to object storage",
      );
    }
  }

  async resolveImageUrl(
    storedUrlOrKey: string | null,
    expiresIn = 86400,
  ): Promise<string | null> {
    if (!storedUrlOrKey) {
      return null;
    }

    if (
      storedUrlOrKey.startsWith("http://localhost:") ||
      storedUrlOrKey.startsWith("http://127.0.0.1:") ||
      storedUrlOrKey.startsWith("/uploads/")
    ) {
      return storedUrlOrKey;
    }

    if (this.isPlaceholder || !this.s3Client) {
      if (
        storedUrlOrKey.startsWith("http://") ||
        storedUrlOrKey.startsWith("https://")
      ) {
        return storedUrlOrKey;
      }
      return `${this.localBaseUrl}/uploads/${storedUrlOrKey.replace(/^\/+/, "")}`;
    }

    let key = storedUrlOrKey;
    if (
      storedUrlOrKey.startsWith("http://") ||
      storedUrlOrKey.startsWith("https://")
    ) {
      try {
        const parsed = new URL(storedUrlOrKey);
        key = parsed.pathname.replace(/^\/+/, "");
      } catch {
        key = storedUrlOrKey;
      }
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (err) {
      this.logger.error(
        `Failed to generate presigned URL for key "${key}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return storedUrlOrKey;
    }
  }
}
