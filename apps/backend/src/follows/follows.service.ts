import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  async follow(
    followerId: string,
    followingId: string,
  ): Promise<{ success: boolean; isFollowing: boolean }> {
    if (followerId === followingId) {
      throw new BadRequestException("You cannot follow yourself");
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with ID "${followingId}" not found`);
    }

    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      create: {
        followerId,
        followingId,
      },
      update: {},
    });

    return {
      success: true,
      isFollowing: true,
    };
  }

  async unfollow(
    followerId: string,
    followingId: string,
  ): Promise<{ success: boolean; isFollowing: boolean }> {
    if (followerId === followingId) {
      throw new BadRequestException("You cannot unfollow yourself");
    }

    await this.prisma.follow.deleteMany({
      where: {
        followerId,
        followingId,
      },
    });

    return {
      success: true,
      isFollowing: false,
    };
  }

  async getFollowers(
    currentUserId: string,
    targetUserId: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      email: string;
      bio: string | null;
      avatarUrl: string | null;
      isFollowing: boolean;
      isSelf: boolean;
    }>
  > {
    const follows = await this.prisma.follow.findMany({
      where: { followingId: targetUserId },
      include: {
        follower: {
          include: {
            followers: currentUserId
              ? {
                  where: { followerId: currentUserId },
                  select: { id: true },
                }
              : false,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return follows.map((f: any) => ({
      id: f.follower.id,
      name: f.follower.name,
      email: f.follower.email,
      bio: f.follower.bio,
      avatarUrl: f.follower.avatarUrl,
      isFollowing:
        Array.isArray(f.follower.followers) && f.follower.followers.length > 0,
      isSelf: currentUserId === f.follower.id,
    }));
  }

  async getFollowing(
    currentUserId: string,
    targetUserId: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      email: string;
      bio: string | null;
      avatarUrl: string | null;
      isFollowing: boolean;
      isSelf: boolean;
    }>
  > {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: targetUserId },
      include: {
        following: {
          include: {
            followers: currentUserId
              ? {
                  where: { followerId: currentUserId },
                  select: { id: true },
                }
              : false,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return follows.map((f: any) => ({
      id: f.following.id,
      name: f.following.name,
      email: f.following.email,
      bio: f.following.bio,
      avatarUrl: f.following.avatarUrl,
      isFollowing:
        Array.isArray(f.following.followers) && f.following.followers.length > 0,
      isSelf: currentUserId === f.following.id,
    }));
  }
}

