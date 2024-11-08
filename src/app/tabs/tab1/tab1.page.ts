import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { DatabaseService } from 'src/app/database.service';
import { AlertController, ModalController } from '@ionic/angular'; // Importa ModalController
import { ActividadDetalleModalPage } from '../../actividad-detalle-modal/actividad-detalle-modal.page';
import { Router } from '@angular/router';
import { WeatherService } from '../../weather.service';
@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
})
export class Tab1Page implements OnInit {
  weatherData: any;
  weatherIconUrl: string='';
  actividades: any[] = []; // Almacenar las actividades
  coloresActividades: string[] = []; // Array para almacenar los colores
  actividadesAleatorias: any[] = []; //Almacenar actividades aleatorias
  colors = [
    'col-card1', 'col-card2', 'col-card3', 'col-card4', 'col-card5'
  ];

  constructor(
    private localS: LocalStorageService,
    private dbService: DatabaseService,
    private alertController: AlertController,
    private router: Router,
    private modalController: ModalController,
    private weatherService: WeatherService
  ) {}

  ngOnInit() {
    const user = this.localS.ObtenerUsuario('user');
    console.log('Usuario:', user);
    this.cargarActividades(); 
    this.getLocationAndWeather();
  }

  cargarActividades() {
    // Obtener el usuario completo desde Local Storage
    const user = this.localS.ObtenerUsuario('user');
    
    // Extraer Id_Comuna del usuario
    const idComuna = user?.Id_Comuna;
    
    if (idComuna) {
      // Llamar al servicio con el Id_Comuna directamente
      this.dbService.getActividades(idComuna).subscribe(
        (data) => {
          this.actividades = data;
  
          // Obtener 6 actividades aleatorias
          this.actividadesAleatorias = this.getRandomActivities(this.actividades, 6);
          
          // Generar colores aleatorios para cada actividad
          this.coloresActividades = this.actividadesAleatorias.map(() => this.getRandomColor());
          
          console.log('Actividades aleatorias:', this.actividadesAleatorias); 
          console.log('Colores asignados:', this.coloresActividades);
        },
        (error) => {
          console.error('Error al obtener actividades:', error);
          this.presentAlert('Error', 'No se pudieron cargar las actividades.');
        }
      );
    } else {
      console.error('No se encontró el Id_Comuna del usuario.');
      this.presentAlert('Error', 'No se pudo cargar el Id_Comuna del usuario.');
    }
  }

  // Método para mostrar una alerta
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  // Método para obtener un color aleatorio
  getRandomColor() {
    const randomIndex = Math.floor(Math.random() * this.colors.length);
    return this.colors[randomIndex];
  }

  // Actividades aleatorias 
  getRandomActivities(actividades: any[], count: number): any[] {
    const shuffled = actividades.sort(() => 0.5 - Math.random()); 
    return shuffled.slice(0, count); 
  }
   // Método para abrir el modal al hacer clic en una tarjeta
   async onCardClick(actividad: any) {
    console.log('Actividad clickeada:', actividad);
    
    const modal = await this.modalController.create({
      component: ActividadDetalleModalPage, // Especifica el componente del modal
      componentProps: {
        actividad: actividad // Pasar los detalles de la actividad al modal
      }
    });
    
    return await modal.present();
  }
  getLocationAndWeather() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        this.weatherService.getWeatherByLocation(lat, lon).subscribe(data => {
          this.weatherData = data; // Guardar datos del clima
          console.log('Datos del clima:', this.weatherData);

          // Obtener el código del icono y construir la URL
          const weatherIconCode = this.weatherData.weather[0].icon; // Obtener el código del ícono
          this.weatherIconUrl = `http://openweathermap.org/img/wn/${weatherIconCode}@2x.png`; // Construir la URL del ícono
          console.log('URL del ícono del clima:', this.weatherIconUrl); // Verificar la URL en la consola
        }, error => {
          console.error('Error al obtener el clima:', error);
          this.presentAlert('Error', 'No se pudo obtener el clima.');
        });
      }, error => {
        console.error('Error al obtener la ubicación:', error);
        this.presentAlert('Error', 'No se pudo obtener la ubicación.');
      });
    } else {
      console.error('Geolocalización no es soportada en este navegador.');
      this.presentAlert('Error', 'Geolocalización no es soportada.');
    }
  }
  
  
}
