import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-foto-perfil-op',
  templateUrl: './foto-perfil-op.component.html',
  styleUrls: ['./foto-perfil-op.component.scss'],
})
export class FotoPerfilOpComponent implements OnInit {
  foto: string | null | undefined = null;

  constructor(private modalController: ModalController) {}

  ngOnInit() {}

  closeModal() {
    this.modalController.dismiss(null, 'backdrop');
  }

  async startCapture(type: string) {
    try {
      const source = type === 'camera' ? CameraSource.Camera : CameraSource.Photos;
      const photo = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.DataUrl,
        source,
      });

      this.foto = photo.dataUrl || null;
      this.modalController.dismiss({ fotoNueva: this.foto });
    } catch (error) {
      console.error('Error al capturar foto:', error);
      this.foto = null;
    }
  }
}