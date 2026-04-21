import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract error message from exception response
    let errorMessage: string;
    
    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      // Handle validation errors from class-validator
      const responseObj = exceptionResponse as any;
      
      if (Array.isArray(responseObj.message)) {
        // Multiple validation errors - join them
        errorMessage = responseObj.message.join(', ');
      } else if (responseObj.message) {
        errorMessage = responseObj.message;
      } else if (responseObj.error) {
        errorMessage = responseObj.error;
      } else {
        errorMessage = 'Internal server error';
      }
    } else {
      errorMessage = 'Internal server error';
    }

    // Format standardized error response
    const errorResponse = {
      error: errorMessage,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
