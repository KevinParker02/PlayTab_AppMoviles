import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { DatabaseService } from 'src/app/database.service';
import { AlertController, ModalController } from '@ionic/angular';
import { FotoPerfilOpComponent } from 'src/app/foto-perfil-op/foto-perfil-op.component';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { response } from 'express';

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
  catgoria: string = '';
  subcategoria: string = '';
  fotoPerfil: string = '../../assets/icon/perfil.png';
  Nom_SubCategoria: string = '';

  isLoading: boolean = false;

  constructor(
    private router: Router,
    private localS: LocalStorageService,
    private dataBase: DatabaseService,
    private alertController: AlertController,
    private modalController: ModalController // Declarar aquí
  ) {}

  ionViewWillEnter() {
    this.cargarDatosUsuario();
  }

  ngOnInit() {}

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  cargarDatosUsuario() {
    const usuario = this.localS.ObtenerUsuario('user');
    if (usuario) {
      this.nombreUser = usuario.Nom_User;
      this.correoUser = usuario.Correo_User;
      this.telefonoUser = usuario.Celular_User;
      this.regionUser = usuario.Nombre_Region;
      this.comunaUser = usuario.Nombre_Comuna;
      this.catgoria = usuario.Nom_Categoria;
      this.Nom_SubCategoria = usuario.Nom_SubCategoria
      this.fotoPerfil = usuario.fotoPerfil || '../../assets/icon/perfil.png';
    } else {
      console.warn('No se encontró información del usuario en el LocalStorage.');
    }
  }

  async abrirModalFotoPerfil() {
    const modal = await this.modalController.create({
      component: FotoPerfilOpComponent,
      cssClass: 'foto-perfil-modal',
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.fotoNueva) {
      this.actualizarFotoPerfil(data.fotoNueva);
    }
  }

  actualizarFotoPerfil(foto: string) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.fotoPerfil = foto;
    localStorage.setItem('user', JSON.stringify(user));
    this.fotoPerfil = foto;
  }

  async deleteAccount() {
    const alert = await this.alertController.create({
      header: 'Eliminación de la cuenta',
      message: '¿Estás seguro? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Si',
          handler: () => {
            
            if (this.isLoading) return;
            this.isLoading = true;

            const usuario = this.localS.ObtenerUsuario('user');
            if (usuario && usuario.Id_User) {
              const idUser = usuario.Id_User;
              this.dataBase.deleteUsuario(idUser).subscribe(
                (response) => {
                  this.presentAlert(
                    'Lamentamos tu partida :(',
                    'Su cuenta ha sido eliminada con éxito.'
                  );
                  this.localS.LimpiarUsuario();
                  localStorage.removeItem('isAuthenticated');
                  this.router.navigate(['./login']);
                },
                (error) => {
                  this.presentAlert(
                    '¿Qué?',
                    'Al parecer su cuenta quedará para siempre aquí :3'
                  );
                }
              );
            } else {
              this.presentAlert('Error', 'No se pudo encontrar el ID de usuario');
            }
          },
        },
      ],
    });
  
    await alert.present();
  }

  cambiarComuna() {
    this.router.navigate(['./cambiacomuna']);
  }

  cambiarActividad(){
    this.router.navigate(['./cambio-actividad-favorita']);
  }

  async logOut() {
    const alert = await this.alertController.create({
      header: 'Cierre de sesión',
      message: '¿Deseas cerrar sesión?',
      buttons: [
        {
          text: 'No',
          role: 'Si',
          cssClass: 'secondary',
        },
        {
          text: 'Cerrar Sesión',
          handler: () => {
            this.localS.ElimnarUsuario('user');
            this.localS.LimpiarUsuario();
            localStorage.removeItem('isAuthenticated');
            this.router.navigate(['./login']);
          },
        },
      ],
    });
  
    await alert.present();
  }

  handleRefresh(event: any) {
    this.cargarDatosUsuario();
    event.target.complete();
  }
}