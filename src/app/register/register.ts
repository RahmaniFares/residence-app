import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../login/login-service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  router = inject(Router);
  loginService = inject(LoginService);

  constructor(private toastr: ToastrService) { }

  // Form fields
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  apartment: string = '';
  phone: string = '';
  password: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  acceptTerms: boolean = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  register() {
    // Validation
    if (!this.firstName || !this.lastName || !this.email || !this.password || !this.confirmPassword) {
      this.toastr.error('Veuillez remplir tous les champs obligatoires.', 'Erreur');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.toastr.error('Les mots de passe ne correspondent pas.', 'Erreur');
      return;
    }

    if (!this.acceptTerms) {
      this.toastr.error('Veuillez accepter les conditions d\'utilisation.', 'Erreur');
      return;
    }

    // Register user
    const success = this.loginService.Register({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      apartment: this.apartment,
      phone: this.phone,
      password: this.password
    });

    if (success) {
      this.toastr.success('Compte créé avec succès! Vous pouvez maintenant vous connecter.', 'Succès');
      this.router.navigate(['/']);
    } else {
      this.toastr.error('Une erreur est survenue lors de la création du compte.', 'Erreur');
    }
  }
}
