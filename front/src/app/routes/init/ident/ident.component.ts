import { CommonModule } from '@angular/common';
import { Component, inject, input, model, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { NzResultModule } from 'ng-zorro-antd/result';

@Component({
  selector: 'app-ident',
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule, ZXingScannerModule, NzResultModule],
  templateUrl: './ident.component.html',
  styleUrl: './ident.component.less'
})
export class IdentComponent {
  allowedBarCodeFormats = [BarcodeFormat.PDF_417]
  codGenerado = model('')
  encTelNro = input('')
  videoConstraints = signal({ facingMode: 'back', with: 1080 })

  private apiService = inject(ApiService)
  cams: any = []
  camdevice = signal(undefined)
  caminfo = signal({})
  curcam = 0
  scannerEnabled = model(false)
  scanComplete(e: any) {
    //    console.log('scanComplete',e)
  }

  async scanSuccess(e: string) {
    try {
      this.scannerEnabled.set(false)
      const res: any = await firstValueFrom(this.apiService.getIdentCode(e, this.encTelNro()));
      this.codGenerado.set(String(res?.data?.codigo))
    } catch (error) {
      this.scannerEnabled.set(true)
    }
  }

  ngOnInit() {
    if (this.encTelNro()) {
      this.scannerEnabled.set(true)
      //      this.cambioCam()
    }

    //    this.codGenerado.set('312312312')
    //    this.scannerEnabled.set(false)
  }

  camerasFoundHandler(cameras: MediaDeviceInfo[]) {
    this.cams = cameras
    setTimeout(() => {
      if (this.camdevice() == undefined) {
        
        for (const cam of this.cams) {
          if (cam.label.match(/camera2 0.*back/)) {
            console.log('seteo', cam.label)
            this.camdevice.set(cam)
            return
          }
        }
        this.cambioCam()
      } else {
          const tmpcam = this.camdevice()
        this.camdevice.set(undefined)
        setTimeout(() => {
          this.camdevice.set(tmpcam)
        },100)
        }
    }, 1500)

  }

  cambioCam() {
    this.curcam++
    if (this.curcam >= this.cams.length)
      this.curcam = 0
    this.camdevice.set(this.cams[this.curcam])
    console.log('cambio a ', this.cams[this.curcam])
  }


}
