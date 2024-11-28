import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { FotoPerfilOpComponent } from './foto-perfil-op.component';

describe('FotoPerfilOpComponent', () => {
  let component: FotoPerfilOpComponent;
  let fixture: ComponentFixture<FotoPerfilOpComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FotoPerfilOpComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(FotoPerfilOpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
