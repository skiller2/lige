import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { FormBuilder } from '@angular/forms';
import { SearchService } from '../../../services/search.service';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import  { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"

@Component({
  selector: 'app-poliza-seguro-drawer',
  imports: [SHARED_IMPORTS, NzUploadModule, NzDescriptionsModule, ReactiveFormsModule, CommonModule, FileUploadComponent],
  templateUrl: './poliza-seguro-drawer.component.html',
  styleUrl: './poliza-seguro-drawer.component.less'
})
export class PolizaSeguroDrawerComponent {

  visible = model<boolean>(false)
  placement: NzDrawerPlacement = 'left';
  tituloDrawer = signal<string>("")
  PolizaSeguroCod = input<number>(0)
  isSaving = signal<boolean>(false)
  $optionsCompaniaSeguro = this.searchService.getCompaniaSeguroSearch();
  private apiService = inject(ApiService)
  disabled = input<boolean>(false)


  constructor(private searchService: SearchService) { 
    
    effect(async() => { 
      const visible = this.visible()
      
      if (visible) {
        if (this.PolizaSeguroCod() > 0) {
          let vals = await firstValueFrom(this.apiService.getPolizaSeguro(this.PolizaSeguroCod()));
        
          


          this.formCli.patchValue(vals[0])
          this.formCli.markAsUntouched()
          this.formCli.markAsPristine()
  
          if (this.disabled()) {
            this.tituloDrawer.set(' Consultar Poliza Seguro ')
            this.formCli.disable()
          } else {
            this.tituloDrawer.set('Editar Poliza Seguro')
            this.formCli.enable()
          }
        }
      } else {
        this.formCli.reset()
        this.formCli.enable()
        this.tituloDrawer.set(' Nuevo Poliza Seguro ')
      }
    })
  }

  async save() {
    this.isSaving.set(true)
    let vals = this.formCli.value
    try {
    
      const res = await firstValueFrom(this.apiService.setPolizaSeguro(vals))
      if(res.data?.list[0]?.PolizaSeguroCod > 0) {
       
        this.formCli.patchValue({
          PolizaSeguroCod: res.data?.list[0]?.PolizaSeguroCod,
        })
        this.tituloDrawer.set('Editar Poliza Seguro')
      }  
      
      this.formCli.markAsUntouched()
      this.formCli.markAsPristine()
     // this.onRefreshPolizaSeguro.emit()
    } catch (error) {
      // Handle error if needed
    }
    this.isSaving.set(false)
  }

  deletePoliza() {
    console.log("deletePoliza")
  }



  fb = inject(FormBuilder)
  formCli = this.fb.group({
    id: 0,
    PolizaSeguroCod: 0,
    TipoSeguroId: 0,
    CompaniaSeguroId: 0,
    PolizaSeguroNroPoliza: "",
    PolizaSeguroNroEndoso: "",
    PolizaSeguroFechaEndoso: ""
  })



}
