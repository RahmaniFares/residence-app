import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoginService {

  Login(loginrequest: any): boolean {

    if (loginrequest.emailOrApartment == "admin" && loginrequest.password == "admin") {
      console.log("Login request:", loginrequest);
      return true;
    } else {
      console.log("Email/Apartment and Password are required.");
    }
    return false;

  }
}
