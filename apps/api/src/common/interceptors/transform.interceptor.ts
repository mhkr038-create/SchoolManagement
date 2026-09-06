import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@school/types';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        // If the controller already returned meta/data separation
        if (response && response.data !== undefined && response.meta !== undefined) {
          return {
            success: true,
            message: response.message,
            data: response.data,
            meta: response.meta,
            timestamp: new Date().toISOString()
          };
        }

        return {
          success: true,
          data: response,
          timestamp: new Date().toISOString()
        };
      })
    );
  }
}
