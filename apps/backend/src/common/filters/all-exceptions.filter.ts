import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(this.toBody(exception, status));
  }

  private toBody(exception: unknown, status: number): ErrorResponseBody {
    const code = HttpStatus[status] ?? "INTERNAL_SERVER_ERROR";

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();

      if (typeof payload === "string") {
        return { error: { code, message: payload } };
      }

      const { message, details } = payload as {
        message?: string | string[];
        details?: unknown;
      };

      const normalized = Array.isArray(message)
        ? message.join("; ")
        : (message ?? exception.message);

      return {
        error: {
          code,
          message: normalized,
          ...(details === undefined ? {} : { details }),
        },
      };
    }

    return {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    };
  }
}
