import { CommonModule } from '@angular/common';
import { LoginService } from './login-service';
import { Component, inject, signal } from '@angular/core';
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
  loading = signal(false);
  LoginService = inject(LoginService);
  router = inject(Router);
  constructor(private toastr: ToastrService) { }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
  signIn(): void {
    if (this.loading()) return;
    this.loading.set(true);

    var loginRequest = {
      emailOrApartment: this.emailOrApartment,
      password: this.password,
      rememberMe: this.rememberMe
    };

    this.LoginService.Login(loginRequest).subscribe({
      next: (response) => {
        console.log("Login successful!", response);
        this.router.navigate(['/dashboard']);
        this.toastr.success("Connexion réussie! Bienvenue.", "Succès de la connexion");
      },
      error: (error) => {
        console.log("Login failed.", error);
        const message = error.error?.message || "Échec de la connexion. Veuillez vérifier vos informations d'identification et réessayer.";
        this.toastr.error(message, "Erreur de connexion");
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }
}
