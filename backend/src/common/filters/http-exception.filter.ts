import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorDetails =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? exceptionResponse
        : { message: exceptionResponse };

    this.logger.warn(
      `[${request.method}] ${request.url} -> Status: ${status} | Error: ${JSON.stringify(errorDetails)}`,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      ...(errorDetails as object),
    });
  }
}
