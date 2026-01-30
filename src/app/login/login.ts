import { CommonModule } from '@angular/common';
import { LoginService } from './login-service';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';



@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  standalone: true,
  styleUrl: './login.css',
})
export class Login {

  emailOrApartment: string = '';
  password: string = '';
  rememberMe: boolean = false;
  showPassword: boolean = false;
  LoginService = inject(LoginService);
  router = inject(Router);
  constructor(private toastr: ToastrService) { }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
  signIn(): void {
    var loginRequest = {
      emailOrApartment: this.emailOrApartment,
      password: this.password,
      rememberMe: this.rememberMe
    };
    const success = this.LoginService.Login(loginRequest);
    if (success) {
      console.log("Login successful!");
      this.router.navigate(['/dashboard']);
      this.toastr.success("Connexion réussie! Bienvenue.", "Succès de la connexion");
    } else {
      console.log("Login failed.");
      this.toastr.error("Échec de la connexion. Veuillez vérifier vos informations d'identification et réessayer.", "Erreur de connexion");
    }
  }
}
