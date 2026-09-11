import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StorageService } from "../storage/storage.service";
import { PostsService } from "./posts.service";
import { FollowsService } from "../follows/follows.service";
import { UsersController } from "../users/users.controller";

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
  const mockStorage = {
    uploadImage: async () => "posts/test.jpg",
    resolveImageUrl: async (url: string | null) =>
      url ? `https://signed.example.com/${url}` : null,
  };

  it("creates a post entity and returns post response", async () => {
    const mockPrisma = {
      post: {
        create: async ({
          data,
        }: {
          data: { content: string; imageUrl: string | null; authorId: string };
        }) => ({
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
          _count: { likes: 0 },
        }),
      },
    };

    const service = new PostsService(mockPrisma as any, mockStorage as any);

    const result = await service.create("user-1", {
      content: "Hello world!",
    });

    assert.equal(result.id, "post-123");
    assert.equal(result.content, "Hello world!");
    assert.equal(result.author.name, "John Doe");
    assert.equal(result.imageUrl, null);
    assert.equal(result.likesCount, 0);
    assert.equal(result.isLiked, false);
  });

  it("updates post when user is the author", async () => {
    const mockPrisma = {
      post: {
        findUnique: async () => ({
          id: "post-123",
          authorId: "user-1",
          content: "Original content",
          imageUrl: null,
        }),
        update: async ({ data }: any) => ({
          id: "post-123",
          authorId: "user-1",
          content: data.content,
          imageUrl: null,
          createdAt: new Date("2026-09-11T00:00:00.000Z"),
          updatedAt: new Date("2026-09-11T00:01:00.000Z"),
          author: { id: "user-1", name: "John Doe", avatarUrl: null },
          _count: { likes: 2 },
          likes: [{ id: "like-1" }],
        }),
      },
    };

    const service = new PostsService(mockPrisma as any, mockStorage as any);
    const updated = await service.update("post-123", "user-1", {
      content: "Updated content",
    });

    assert.equal(updated.content, "Updated content");
    assert.equal(updated.likesCount, 2);
    assert.equal(updated.isLiked, true);
  });

  it("throws ForbiddenException when updating someone else's post", async () => {
    const mockPrisma = {
      post: {
        findUnique: async () => ({
          id: "post-123",
          authorId: "user-author",
          content: "Original",
        }),
      },
    };

    const service = new PostsService(mockPrisma as any, mockStorage as any);
    await assert.rejects(
      () =>
        service.update("post-123", "user-intruder", {
          content: "Hacked",
        }),
      ForbiddenException,
    );
  });

  it("deletes post when user is author", async () => {
    let deletedId = "";
    const mockPrisma = {
      post: {
        findUnique: async () => ({
          id: "post-123",
          authorId: "user-1",
        }),
        delete: async ({ where }: any) => {
          deletedId = where.id;
          return { id: where.id };
        },
      },
    };

    const service = new PostsService(mockPrisma as any, mockStorage as any);
    const res = await service.delete("post-123", "user-1");

    assert.equal(res.success, true);
    assert.equal(deletedId, "post-123");
  });

  it("throws ForbiddenException when deleting someone else's post", async () => {
    const mockPrisma = {
      post: {
        findUnique: async () => ({
          id: "post-123",
          authorId: "user-author",
        }),
      },
    };

    const service = new PostsService(mockPrisma as any, mockStorage as any);
    await assert.rejects(
      () => service.delete("post-123", "user-intruder"),
      ForbiddenException,
    );
  });

  it("likes and unlikes a post correctly", async () => {
    let upserted = false;
    let deleted = false;
    const mockPrisma = {
      post: {
        findUnique: async () => ({ id: "post-123" }),
      },
      like: {
        upsert: async () => {
          upserted = true;
          return {};
        },
        deleteMany: async () => {
          deleted = true;
          return { count: 1 };
        },
        count: async () => (upserted && !deleted ? 1 : 0),
      },
    };

    const service = new PostsService(mockPrisma as any, mockStorage as any);
    const likeRes = await service.like("post-123", "user-1");
    assert.equal(likeRes.success, true);
    assert.equal(likeRes.isLiked, true);
    assert.equal(likeRes.likesCount, 1);

    const unlikeRes = await service.unlike("post-123", "user-1");
    assert.equal(unlikeRes.success, true);
    assert.equal(unlikeRes.isLiked, false);
    assert.equal(unlikeRes.likesCount, 0);
  });
});

describe("FollowsService", () => {
  it("prevents following self", async () => {
    const service = new FollowsService({} as any);
    await assert.rejects(
      () => service.follow("user-1", "user-1"),
      BadRequestException,
    );
    await assert.rejects(
      () => service.unfollow("user-1", "user-1"),
      BadRequestException,
    );
  });

  it("allows following and unfollowing another user", async () => {
    let followCreated = false;
    let followDeleted = false;

    const mockPrisma = {
      user: {
        findUnique: async () => ({ id: "user-2" }),
      },
      follow: {
        upsert: async () => {
          followCreated = true;
          return {};
        },
        deleteMany: async () => {
          followDeleted = true;
          return { count: 1 };
        },
      },
    };

    const service = new FollowsService(mockPrisma as any);
    const followRes = await service.follow("user-1", "user-2");
    assert.equal(followRes.success, true);
    assert.equal(followRes.isFollowing, true);
    assert.equal(followCreated, true);

    const unfollowRes = await service.unfollow("user-1", "user-2");
    assert.equal(unfollowRes.success, true);
    assert.equal(unfollowRes.isFollowing, false);
    assert.equal(followDeleted, true);
  });
});

describe("PostsService - findAll with authorId", () => {
  it("filters posts by authorId", async () => {
    let capturedWhere: any = null;
    const mockPrisma = {
      post: {
        findMany: async (args: any) => {
          capturedWhere = args.where;
          return [
            {
              id: "p1",
              authorId: "author-abc",
              content: "Hello",
              imageUrl: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              author: { id: "author-abc", name: "Author", avatarUrl: null },
              _count: { likes: 0 },
            },
          ];
        },
      },
    };
    const mockStorage = {
      resolveImageUrl: async (url: any) => url,
    };

    const service = new PostsService(mockPrisma as any, mockStorage as any);
    const result = await service.findAll("current-user", { authorId: "author-abc" });

    assert.deepEqual(capturedWhere, { authorId: "author-abc" });
    assert.equal(result.posts.length, 1);
    assert.equal(result.posts[0]?.authorId, "author-abc");
  });
});

describe("UsersController", () => {
  it("returns user profile with counts and isFollowing", async () => {
    const mockPrisma = {
      user: {
        findUnique: async (args: any) => {
          if (args.where.id === "user-target") {
            return {
              id: "user-target",
              email: "target@example.com",
              name: "Target User",
              bio: "Developer",
              avatarUrl: "https://avatar.png",
              createdAt: new Date(),
              _count: {
                followers: 5,
                following: 3,
                posts: 10,
              },
              followers: [{ id: "f-1" }],
            };
          }
          return null;
        },
      },
    };

    const controller = new UsersController(mockPrisma as any);
    const result = await controller.getUserProfile(
      { id: "current-user" } as any,
      "user-target",
    );

    assert.equal(result.data.id, "user-target");
    assert.equal(result.data.name, "Target User");
    assert.equal(result.data.bio, "Developer");
    assert.equal(result.data.followersCount, 5);
    assert.equal(result.data.followingCount, 3);
    assert.equal(result.data.postsCount, 10);
    assert.equal(result.data.isFollowing, true);
    assert.equal(result.data.isSelf, false);
  });

  it("throws NotFoundException if user not found", async () => {
    const mockPrisma = {
      user: {
        findUnique: async () => null,
      },
    };

    const controller = new UsersController(mockPrisma as any);
    await assert.rejects(
      () => controller.getUserProfile({ id: "current-user" } as any, "non-existent"),
      NotFoundException,
    );
  });

  it("returns recent users with counts and follow status", async () => {
    let capturedQuery: any = null;
    const mockPrisma = {
      user: {
        findMany: async (args: any) => {
          capturedQuery = args;
          return [
            {
              id: "user-1",
              email: "recent@example.com",
              name: "Recent User",
              bio: "Designer",
              avatarUrl: null,
              createdAt: new Date(),
              _count: { followers: 2, following: 1, posts: 3 },
              followers: [{ id: "f-1" }],
            },
          ];
        },
      },
    };

    const controller = new UsersController(mockPrisma as any);
    const result = await controller.recent({ id: "current-user" } as any, "5");

    assert.equal(capturedQuery.take, 5);
    assert.deepEqual(capturedQuery.orderBy, { createdAt: "desc" });
    assert.equal(result.data.length, 1);
    assert.equal(result.data[0]?.name, "Recent User");
    assert.equal(result.data[0]?.email, "recent@example.com");
    assert.equal(result.data[0]?.isFollowing, true);
    assert.equal(result.data[0]?.isSelf, false);
  });

  it("searches users by name or email", async () => {
    let capturedQuery: any = null;
    const mockPrisma = {
      user: {
        findMany: async (args: any) => {
          capturedQuery = args;
          return [
            {
              id: "user-2",
              email: "alex@workmate.com",
              name: "Alex Smith",
              bio: null,
              avatarUrl: null,
              createdAt: new Date(),
              _count: { followers: 0, following: 0, posts: 0 },
              followers: [],
            },
          ];
        },
      },
    };

    const controller = new UsersController(mockPrisma as any);
    const result = await controller.search({ id: "current-user" } as any, "Alex");

    assert.deepEqual(capturedQuery.where.AND[1], {
      OR: [{ name: { contains: "Alex" } }, { email: { contains: "Alex" } }],
    });
    assert.equal(result.data.length, 1);
    assert.equal(result.data[0]?.name, "Alex Smith");
    assert.equal(result.data[0]?.isFollowing, false);
  });
});
