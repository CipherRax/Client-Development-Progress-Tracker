import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'InternalServerError';
    let message: string | string[] = 'An unexpected error occurred.';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const anyBody = body as any;
        message = anyBody.message ?? exception.message;
        error = anyBody.error ?? HttpStatus[statusCode];
      }
      error = error || HttpStatus[statusCode];
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          statusCode = HttpStatus.CONFLICT;
          error = 'Conflict';
          message = 'A record with the same unique value already exists.';
          break;
        case 'P2025':
          statusCode = HttpStatus.NOT_FOUND;
          error = 'NotFound';
          message = 'The requested resource was not found.';
          break;
        case 'P2003':
          statusCode = HttpStatus.BAD_REQUEST;
          error = 'BadRequest';
          message = 'Invalid reference to a related resource.';
          break;
        default:
          statusCode = HttpStatus.BAD_REQUEST;
          error = 'DatabaseError';
          message = 'A database error occurred while processing the request.';
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.error('Unknown exception thrown', JSON.stringify(exception));
    }

    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
