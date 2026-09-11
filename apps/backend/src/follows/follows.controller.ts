import { Controller, Delete, Param, Post } from "@nestjs/common";
import type { User } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { FollowsService } from "./follows.service";

@Controller("follows")
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(":userId")
  async follow(
    @CurrentUser() user: User,
    @Param("userId") targetUserId: string,
  ): Promise<{ success: boolean; isFollowing: boolean }> {
    return this.followsService.follow(user.id, targetUserId);
  }

  @Delete(":userId")
  async unfollow(
    @CurrentUser() user: User,
    @Param("userId") targetUserId: string,
  ): Promise<{ success: boolean; isFollowing: boolean }> {
    return this.followsService.unfollow(user.id, targetUserId);
  }
}
