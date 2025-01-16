import { CommonModule } from '@angular/common';
import { Component, inject, input, model, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NgForm, FormArray, FormBuilder, ValueChangeEvent, FormGroup, FormControl } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ActivatedRoute } from '@angular/router';



@Component({
  selector: 'app-ident',
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule, ZXingScannerModule, NzResultModule, NzCollapseModule],
  templateUrl: './ident.component.html',
  styleUrl: './ident.component.less'
})
export class IdentComponent {
  allowedBarCodeFormats = [BarcodeFormat.PDF_417]
  codGenerado = model('')
  encTelNro = input('')
  videoConstraints = signal({ facingMode: 'back', with: 1080 })
  collapseDisabled = signal(true)
  codigo = signal(0)
  private apiService = inject(ApiService)
  passwordVisible = false;
  password?: string;
  retries = signal(0)
  cams: any = []
  camdevice = signal(undefined)
  caminfo = signal({})
  curcam = 0
  scannerEnabled = model(false)
  scanComplete(e: any) {
    //    console.log('scanComplete',e)
  }
  constructor(
    private route: ActivatedRoute, 
    private message: NzMessageService
  ) {}

  fb = inject(FormBuilder)
  formCli = this.fb.group({
    id: 0,
    cuit: "",
    recibo:"",
    cbu:""
  })

  panels = signal([
    {
      active: true,
      id: 1,
      name: 'Paso 1 - Validar CUIT',
      disabled: false,
      success: false
    },
    {
      active: false,
      id: 2,
      name: 'Paso 2 - Términos y Condiciones',
      disabled: true,
      success: false
    },
    {
      active: false,
      id: 3,
      name: 'Paso 3 - Numero Ultimo Recibo',
      disabled: true,
      success : false
    },
    {
      active: false,
      id: 4,
      name: 'Paso 4 - Últimos 6 dígitos del CBU',
      disabled: true,
      success : false
    }
  ]);


  async consultCuit() {

    let cuit = this.formCli.value?.cuit
    try {
      let result = await firstValueFrom(this.apiService.getValidateCuit(cuit))
      
        this.panels.update((currentPanels) =>
          currentPanels.map((panel) => {
            if (panel.id === 1) {
              return { ...panel, active: false, disabled: true, success: true };
            } else if (panel.id === 2) {
              return { ...panel, active: true, disabled: false };
            }
            return panel
          })
        );
     
      this.retries.set(0)
      this.formCli.markAsPristine()
      this.formCli.markAsUntouched()
    } catch (e) {
      this.validateRetries()
      this.formCli.markAsPristine()
      this.formCli.markAsUntouched()
    }


  }

  async validateRetries(){
    this.retries.set(this.retries() + 1)
  }

  async newValidate(){

    // window.location.reload(); 

    this.panels.update((currentPanels) =>
      currentPanels.map((panel) => {
        if (panel.id === 1) {
          return { ...panel, active: true, disabled: false, success: false  };
        } 
        if (panel.id === 2) {
          return { ...panel, active: false, disabled: true, success: false  };
        }
        if (panel.id === 3) {
          return { ...panel, active: false, disabled: true, success: false  };
        }
        if (panel.id === 4) {
          return { ...panel, active: false, disabled: true, success: false  };
        }
        return panel
      })
    );

    this.codigo.set(0)
    this.retries.set(0)
    this.formCli.patchValue({id: 0, cuit: "", recibo:"", cbu:"" });
  }

  async aceptTerminos() {

    try {
    
        this.panels.update((currentPanels) =>
          currentPanels.map((panel) => {
            if (panel.id === 2) {
              return { ...panel, active: false, disabled: true, success: true  };
            } else if (panel.id === 3) {
              return { ...panel, active: true, disabled: false };
            }
            return panel
          })
        );
      
    } catch (e) {

    }

  }

  async consulrecibo() {

    let recibo = this.formCli.value?.recibo
    let cuit = this.formCli.value?.cuit
    try {
      let result = await firstValueFrom(this.apiService.getValidateRecibo(recibo,cuit))
      console.log("result recibo", result)
      
        this.panels.update((currentPanels) =>
          currentPanels.map((panel) => {
            if (panel.id === 3) {
              return { ...panel, active: false, disabled: true,  success: true  };
            } else if (panel.id === 4) {
              return { ...panel, active: true, disabled: false };
            }
            return panel
          })
        );
      this.retries.set(0)
      this.formCli.markAsPristine()
      this.formCli.markAsUntouched()
    } catch (e) {
      this.validateRetries()
      this.formCli.markAsPristine()
      this.formCli.markAsUntouched()
    }


  }

  async consulCBU() {

    let cbu = this.formCli.value?.cbu
    let cuit = this.formCli.value?.cuit

 
    try {

      let encTelNro = this.route.snapshot.paramMap.get('encTelNro')
      let result = await firstValueFrom(this.apiService.getValidateCBU(cbu,cuit,encTelNro))
      console.log("result ", result)
   
      this.codigo.set( result)
      this.retries.set(0)
    } catch (e) {
      this.validateRetries()
      this.formCli.markAsPristine()
      this.formCli.markAsUntouched()
    }


  }

  async copyNumber() {
    const number = this.codigo() 
    navigator.clipboard.writeText(number.toString()) 
      .then(() => {
        const message = document.getElementById('message')
        this.message.create("success", `¡Número copiado! `)
      })
      .catch(err => this.message.create("error", `El CBU seleccionado no Existe `));
  }


  ngOnInit() {

    if (this.encTelNro()) {
      this.scannerEnabled.set(true)

    }

  }

  // async scanSuccess(e: string) {
  //   try {
  //     this.scannerEnabled.set(false)
  //     const res: any = await firstValueFrom(this.apiService.getIdentCode(e, this.encTelNro()));
  //     this.codGenerado.set(String(res?.data?.codigo))
  //   } catch (error) {
  //     this.scannerEnabled.set(true)
  //   }
  // }

  // camerasFoundHandler(cameras: MediaDeviceInfo[]) {
  //   this.cams = cameras
  //   setTimeout(() => {
  //     if (this.camdevice() == undefined) {

  //       for (const cam of this.cams) {
  //         if (cam.label.match(/camera2 0.*back/)) {
  //           console.log('seteo', cam.label)
  //           this.camdevice.set(cam)
  //           return
  //         }
  //       }
  //       this.cambioCam()
  //     } else {
  //         const tmpcam = this.camdevice()
  //       this.camdevice.set(undefined)
  //       setTimeout(() => {
  //         this.camdevice.set(tmpcam)
  //       },100)
  //       }
  //   }, 1500)

  // }

  // cambioCam() {
  //   this.curcam++
  //   if (this.curcam >= this.cams.length)
  //     this.curcam = 0
  //   this.camdevice.set(this.cams[this.curcam])
  //   console.log('cambio a ', this.cams[this.curcam])
  // }


}
