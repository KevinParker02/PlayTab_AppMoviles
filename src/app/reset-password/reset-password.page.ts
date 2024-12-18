import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
})
export class ResetPasswordPage implements OnInit {
  resetForm: FormGroup;

  isLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private alertController: AlertController,
    private router: Router
  ) {
    this.resetForm = this.fb.group({
      token: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit() {}

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  onSubmit() {
    if (this.isLoading) return; 
    this.isLoading = true;
  
    if (this.resetForm.valid) {
      const { token, newPassword, confirmPassword } = this.resetForm.value;
  
      if (newPassword !== confirmPassword) {
        this.presentAlert('Error', 'Las contraseñas no coinciden.');
        this.isLoading = false; 
        return;
      }
  
      this.http.post('https://backendoutmate-production.up.railway.app/reset-password', { token, newPassword })
        .subscribe({
          next: () => {
            this.presentAlert('¡Muy Bien!', 'Contraseña restablecida exitosamente.');
            this.router.navigate(['/login']);
          },
          error: (error) => {
            this.presentAlert('Error', 'Token inválido o error al actualizar la contraseña.');
            console.error(error);
          },
          complete: () => {
            this.isLoading = false; 
          }
        });
    } else {
      this.presentAlert('Error', 'Formulario inválido. Verifique los campos.');
      this.isLoading = false;
    }
  }
}
