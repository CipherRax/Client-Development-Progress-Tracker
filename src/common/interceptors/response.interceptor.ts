import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function isPaginatedResult(value: any): value is PaginatedResult<any> {
  return (
    value &&
    typeof value === 'object' &&
    Array.isArray(value.items) &&
    value.meta &&
    typeof value.meta.page === 'number'
  );
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((result) => {
        // Allow handlers to opt out (e.g. already-shaped payloads) by returning { __raw: true, ...payload }
        if (result && result.__raw) {
          const rest = { ...result };
          delete rest.__raw;
          return rest;
        }

        if (isPaginatedResult(result)) {
          return {
            success: true,
            data: result.items,
            meta: result.meta,
          };
        }

        if (result && typeof result === 'object' && 'message' in result && 'data' in result) {
          return {
            success: true,
            data: result.data,
            message: result.message,
          };
        }

        return {
          success: true,
          data: result === undefined ? null : result,
        };
      }),
    );
  }
}
