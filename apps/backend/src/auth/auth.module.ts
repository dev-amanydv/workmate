import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { GoogleStrategy } from "./strategies/google.strategy";

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, GoogleAuthGuard],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
