import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import type { User } from "@prisma/client";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";

import { AuthService } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    config: ConfigService,
    private readonly auth: AuthService,
  ) {
    super({
      clientID: config.get<string>("GOOGLE_CLIENT_ID", ""),
      clientSecret: config.get<string>("GOOGLE_CLIENT_SECRET", ""),
      callbackURL: config.getOrThrow<string>("GOOGLE_CALLBACK_URL"),
      scope: ["email", "profile"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const user: User = await this.auth.validateGoogleUser(profile);
      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  }
}
