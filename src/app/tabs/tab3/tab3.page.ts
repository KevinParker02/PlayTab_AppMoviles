import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { DatabaseService } from 'src/app/database.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
})
export class Tab3Page implements OnInit {
  nombreUser: string = '';
  telefonoUser: string = '';
  correoUser: string = '';
  regionUser: string = '';
  comunaUser: string = '';

  constructor(private router:Router, private localS : LocalStorageService, private dataBase: DatabaseService, private alertController: AlertController) { }

  ngOnInit() {
    const usuario = this.localS.ObtenerUsuario('user');
      if (usuario) {
        this.nombreUser = usuario.Nom_User;
        this.correoUser = usuario.Correo_User;
        this.telefonoUser = usuario.Celular_User;
        this.regionUser = usuario.Nombre_Region;
        this.comunaUser = usuario.Nombre_Comuna;
      } else {
        console.warn('No se encontró información del usuario en el LocalStorage.');
      }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  deleteAccount(){
    const usuario = this.localS.ObtenerUsuario('user');
    if (usuario && usuario.Id_User) {
      const idUser = usuario.Id_User;
      this.dataBase.deleteUsuario(idUser).subscribe(
        (response) => {
          this.presentAlert('Lamentamos tu partida :(','Su cuenta ha sido eliminada con éxito.');
          this.localS.LimpiarUsuario();
          localStorage.removeItem('isAuthenticated');
          this.router.navigate(['./login']);
        },
        (error) => {
          this.presentAlert('¿Qué?','Al parecer su cuenta quedará para siempre aquí :3');
        }
      );      
    } else {
      this.presentAlert('Error','No se pudo encontrar el ID de usuario');
    }
  }

  logOut(){
    this.localS.LimpiarUsuario();
    localStorage.removeItem('isAuthenticated');
    this.router.navigate(['./login']);
  }

}
