import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../database.service'; // Importa tu servicio
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular'; // Importa AlertController

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  nombre: string = '';  // Inicializa como cadena vacía
  rut: string = '';
  mailuser: string = '';
  celular: string = '';
  password: string = '';
  ConfirmPassword: string = '';
  regionId: any[] = [];   
  comunaId: any[] = []; 
  region: number = 0; 
  comuna: number = 0; 
  fechaNacimiento: string = ''; // Agregado para la fecha de nacimiento
  showCalendar: boolean = false;
  AceptaCondiciones: boolean = false;
  showPassword: boolean = false;

  isLoading: boolean = false;

  constructor(
    private router : Router,
    private dbService: DatabaseService, // Inyecta el servicio
    private alertController: AlertController
  ) {}

  ngOnInit() {
    // Obtener todas las regiones al cargar el componente
    this.dbService.getRegiones().subscribe((data) => {
      this.regionId = data; 
    });
  }

  onRegionChange() {
    console.log('Región seleccionada:', this.region);
  
    this.dbService.getComunasPorRegion(this.region).subscribe((data) => {
      this.comunaId = data;
      console.log('Datos de comunas recibidos:', data); // Verifica qué campos estás recibiendo
    },
    (error) => {
      console.error('Error al obtener comunas:', error);
    });
  }
  

  // Método para alternar la visibilidad de la contraseña
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // Método que permite mostrar una alerta
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  formatFechaNacimiento(event: any) {
    let input = event.target.value.replace(/[^0-9]/g, '');
    if (input.length > 4) {
      input = input.slice(0, 4) + '-' + input.slice(4);
    }
    if (input.length > 7) {
      input = input.slice(0, 7) + '-' + input.slice(7);
    }
    this.fechaNacimiento = input.slice(0, 10);
  }
  
  validateCelular(event: any) {
    const input = event.target.value;
    if (!input.startsWith('+569')) {
      this.celular = '+569';
    } else {
      this.celular = input;
    }
  }

  // Método para el registro de usuario
  async SingUp() {
    if (this.isLoading) return;
    this.isLoading = true;
  
    if (!this.nombre || !this.rut || !this.mailuser || !this.celular || !this.password || !this.ConfirmPassword || !this.fechaNacimiento) {
      this.presentAlert('Error', 'Faltan rellenar campos.');
      this.isLoading = false;
      return;
    }
 
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{1,50}$/;
    if (!nameRegex.test(this.nombre)) {
      this.presentAlert('Error', 'Ingrese su nombre correctamente.');
      this.isLoading = false;
      return;
    }
  
    const rutRegex = /^\d{7,8}-[kK\d]$/;
    if (!rutRegex.test(this.rut)) {
      this.presentAlert('Error', 'Ingrese un RUT válido.');
      this.isLoading = false;
      return;
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|cl)$/i;
    if (!emailRegex.test(this.mailuser)) {
      this.presentAlert('Error', 'El correo es inválido.');
      this.isLoading = false;
      return;
    }

    const phoneRegex = /^\+569\d{8}$/;
    if (!phoneRegex.test(this.celular)) {
      this.presentAlert('Error', 'Número de celular inválido.');
      this.isLoading = false;
      return;
    }
  
    // Validar la contraseña
    if (this.password.length < 6 || this.password.length > 8) {
      this.presentAlert('Error', 'La contraseña debe tener mínimo 6 caracteres y máximo 8.');
      this.isLoading = false;
      return;
    }
  
    // Validar que ambas contraseñas sean iguales
    if (this.password !== this.ConfirmPassword) {
      this.presentAlert('Error', 'Las contraseñas no coinciden.');
      this.isLoading = false;
      return;
    }
  
    // Validar región y comuna
    if (!this.regionId) {
      this.presentAlert('Error', 'Debe seleccionar una región.');
      this.isLoading = false;
      return;
    }
  
    if (!this.comuna) {
      this.presentAlert('Error', 'Debe seleccionar una comuna.');
      this.isLoading = false;
      return;
    }
  
    // Validar fecha de nacimiento
    const regex = /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
    if (!this.fechaNacimiento.match(regex)) {
      this.presentAlert('Error', 'Por favor, ingrese una fecha válida.');
      this.isLoading = false;
      return;
    }
  
    if (!this.AceptaCondiciones) {
      this.presentAlert('Error', 'Debe aceptar los términos y condiciones.');
      this.isLoading = false;
      return;
    }
  
    try {
      await this.dbService.registerUser(
        this.rut,
        this.nombre,
        this.mailuser,
        this.password,
        this.celular,
        this.comuna,
        this.fechaNacimiento
      ).toPromise();
  
      this.presentAlert('¡Felicidades!', 'Usuario registrado con éxito.');
      this.rut = '';
      this.nombre = '';
      this.mailuser = '';
      this.celular = '';
      this.password = '';
      this.ConfirmPassword = '';
      this.region = 0;
      this.comuna = 0;
      this.fechaNacimiento = '';
      this.router.navigate(['./login']);
    } catch (error) {
      this.presentAlert('Error', 'No se pudo registrar el usuario.');
    } finally {
      this.isLoading = false; 
    }
  }  
}
