import { Controller, Get } from "@nestjs/common";
import type { User } from "@prisma/client";

import { UserResponseDto } from "../auth/dto/user-response.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("users")
export class UsersController {
  @Get("me")
  me(@CurrentUser() user: User): { data: UserResponseDto } {
    return { data: UserResponseDto.fromUser(user) };
  }
}
