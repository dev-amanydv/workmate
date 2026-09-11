import { randomUUID } from "node:crypto";
import path from "node:path";
import "multer";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly publicUrl: string;
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
      this.logger.warn(
        `[Placeholder R2] Simulated upload for file "${file.originalname}" (${file.size} bytes). Key: ${key}`,
      );
      return `${this.publicUrl}/${key}`;
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

      return `${this.publicUrl}/${key}`;
    } catch (error) {
      this.logger.error(
        `Failed to upload image to Cloudflare R2: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        "Failed to upload image to object storage",
      );
    }
  }
}
