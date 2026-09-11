import "reflect-metadata";

import { Logger, RequestMethod, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { IoAdapter } from "@nestjs/platform-socket.io";
import fs from "node:fs";
import path from "node:path";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get(ConfigService);
  const port = config.getOrThrow<number>("PORT");
  const frontendUrl = config.getOrThrow<string>("FRONTEND_URL");
  const uploadsDir = path.resolve(
    process.cwd(),
    config.get<string>("UPLOADS_DIR", "./uploads"),
  );

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  app.useWebSocketAdapter(new IoAdapter(app));

  app.useStaticAssets(uploadsDir, {
    prefix: "/uploads/",
  });

  app.enableCors({ origin: frontendUrl, credentials: true });

  app.setGlobalPrefix("api", {
    exclude: [{ path: "health", method: RequestMethod.GET }],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableShutdownHooks();

  await app.listen(port);

  Logger.log(
    `Backend listening on http://localhost:${port} (health: /health)`,
    "Bootstrap",
  );
}

void bootstrap();
