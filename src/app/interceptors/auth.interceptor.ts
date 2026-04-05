import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { LoginService } from '../login/login-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const loginService = inject(LoginService);
    const token = loginService.getToken();

    let authReq = req;
    if (token) {
        authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                const refreshToken = loginService.getRefreshToken();
                if (refreshToken && token) {
                    return loginService.refreshToken({ token, refreshToken }).pipe(
                        switchMap(() => {
                            const newToken = loginService.getToken();
                            if (newToken) {
                                const retryReq = req.clone({
                                    setHeaders: {
                                        Authorization: `Bearer ${newToken}`
                                    }
                                });
                                return next(retryReq);
                            }
                            return throwError(() => error);
                        }),
                        catchError(() => {
                            loginService.Logout();
                            return throwError(() => error);
                        })
                    );
                } else {
                    loginService.Logout();
                    return throwError(() => error);
                }
            }
            return throwError(() => error);
        })
    );
};
