import { Component, inject, input, model } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-ident',
  standalone: true,
  imports: [...SHARED_IMPORTS, ZXingScannerModule],
  templateUrl: './ident.component.html',
  styleUrl: './ident.component.less'
})
export class IdentComponent {
  allowedBarCodeFormats = [BarcodeFormat.PDF_417, BarcodeFormat.QR_CODE]
  codGenerado = model('')
  encTelNro = input('')
  identData = model('A@B@C@23329580')
  lastScan = ''
  private apiService = inject(ApiService)
  camdevice = undefined
  cams:any = []
  curcam = 0
  scanComplete(e:any) {
//    console.log('scanComplete',e)
  }

  async scanSuccess(e: string) {
    if (e == this.lastScan)
      return
    Crypto.arguments


    const res: any = await firstValueFrom(this.apiService.getIdentCode(e,this.encTelNro()));

    this.codGenerado.set(String(res?.data?.codigo))

    console.log('scanComplete',e)
    this.lastScan = e
  }

  async encode(e: string) {
    if (e == this.lastScan)
      return
    Crypto.arguments


    const res: any = await firstValueFrom(this.apiService.genIdentCode(e));

    this.codGenerado.set(String(res?.data?.codigo))

    console.log('scanComplete',e)
    this.lastScan = e
  }
  
  ngOnInit() {
    
  }

  camerasFoundHandler(cams: any) {
    console.log('cameras', cams)
    this.cams = cams
  }

  cambioCam() {
    this.curcam++
    if (this.curcam >= this.cams.length)
      this.curcam = this.cams.length - 1
    console.log('cambio a ',this.cams[this.curcam])
    this.camdevice = this.cams[this.curcam].deviceId
    
    
  }

}
