import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(
	request: HttpRequest<any>,
	next: HttpHandler
  ): Observable<HttpEvent<any>> {
	return next.handle(request).pipe(
	  catchError((error: HttpErrorResponse) => {
		let errorMessage = 'An error occurred';

		if (error.error instanceof ErrorEvent) {
		  errorMessage = `Error: ${error.error.message}`;
		} else {
		  errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
		}

		console.error(errorMessage);
		return throwError(() => new Error(errorMessage));
	  })
	);
  }
}
