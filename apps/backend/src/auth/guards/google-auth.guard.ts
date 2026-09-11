import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";

import { AuthService } from "../auth.service";

@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  constructor(private readonly auth: AuthService) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    this.auth.assertGoogleConfigured();
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser | false {
    if (err) {
      this.logger.warn(`Google OAuth failed: ${err.message}`);
      throw err;
    }
    return user;
  }
}
