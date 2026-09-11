import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StorageService } from "../storage/storage.service";
import { PostsService } from "./posts.service";

describe("StorageService", () => {
  const config = new ConfigService({
    R2_ACCOUNT_ID: "placeholder_account_id",
    R2_ACCESS_KEY_ID: "placeholder_access_key",
    R2_SECRET_ACCESS_KEY: "placeholder_secret_key",
    R2_BUCKET_NAME: "workmate",
    R2_PUBLIC_URL: "https://pub-workmate.r2.dev",
  });
  const storage = new StorageService(config);

  it("rejects non-whitelisted image mime types", () => {
    const invalidFile = {
      fieldname: "image",
      originalname: "malicious.exe",
      encoding: "7bit",
      mimetype: "application/x-msdownload",
      size: 1024,
      buffer: Buffer.from("dummy"),
    } as Express.Multer.File;

    assert.throws(() => storage.validateImage(invalidFile), BadRequestException);
  });

  it("rejects files exceeding the 5MB size limit", () => {
    const largeFile = {
      fieldname: "image",
      originalname: "large.png",
      encoding: "7bit",
      mimetype: "image/png",
      size: 6 * 1024 * 1024,
      buffer: Buffer.alloc(100),
    } as Express.Multer.File;

    assert.throws(() => storage.validateImage(largeFile), BadRequestException);
  });

  it("simulates upload with placeholder credentials returning public url", async () => {
    const validFile = {
      fieldname: "image",
      originalname: "test.jpg",
      encoding: "7bit",
      mimetype: "image/jpeg",
      size: 1024,
      buffer: Buffer.from("image content"),
    } as Express.Multer.File;

    const url = await storage.uploadImage(validFile, "posts");
    assert.ok(url.startsWith("http://localhost:4000/uploads/posts/"));
    assert.ok(url.endsWith(".jpg"));
  });

  it("resolves stored local and placeholder keys properly", async () => {
    const localUrl = "http://localhost:4000/uploads/posts/abc.jpg";
    assert.equal(await storage.resolveImageUrl(localUrl), localUrl);

    const nullResult = await storage.resolveImageUrl(null);
    assert.equal(nullResult, null);

    const placeholderKey = "posts/abc.jpg";
    const resolved = await storage.resolveImageUrl(placeholderKey);
    assert.equal(resolved, "http://localhost:4000/uploads/posts/abc.jpg");
  });
});

describe("PostsService", () => {
  it("creates a post entity and returns post response", async () => {
    const mockPrisma = {
      post: {
        create: async ({ data }: { data: { content: string; imageUrl: string | null; authorId: string } }) => ({
          id: "post-123",
          authorId: data.authorId,
          content: data.content,
          imageUrl: data.imageUrl,
          createdAt: new Date("2026-09-11T00:00:00.000Z"),
          updatedAt: new Date("2026-09-11T00:00:00.000Z"),
          author: {
            id: data.authorId,
            name: "John Doe",
            avatarUrl: null,
          },
        }),
      },
    };

    const mockStorage = {
      uploadImage: async () => "posts/test.jpg",
      resolveImageUrl: async (url: string | null) => url ? `https://signed.example.com/${url}` : null,
    };

    const service = new PostsService(mockPrisma as any, mockStorage as any);

    const result = await service.create("user-1", {
      content: "Hello world!",
    });

    assert.equal(result.id, "post-123");
    assert.equal(result.content, "Hello world!");
    assert.equal(result.author.name, "John Doe");
    assert.equal(result.imageUrl, null);
  });
});
