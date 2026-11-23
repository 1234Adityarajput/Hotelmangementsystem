import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
        ? exception.message
        : 'Internal server error';

    let resolvedMessage: string | object = rawMessage;
    if (typeof rawMessage === 'object' && rawMessage !== null) {
      resolvedMessage =
        (rawMessage as Record<string, unknown>).message !== undefined
          ? ((rawMessage as Record<string, unknown>).message as string)
          : rawMessage;
    }

    this.logger.error(
      `[${request.method}] ${request.url} Unhandled Exception:`,
      exception instanceof Error ? exception.stack : exception,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      message: resolvedMessage,
    });
  }
}
