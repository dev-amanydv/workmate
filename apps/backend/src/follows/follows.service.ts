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
}
