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


@Component({
  selector: 'app-poliza-seguro-drawer',
  imports: [SHARED_IMPORTS, NzUploadModule, NzDescriptionsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './poliza-seguro-drawer.component.html',
  styleUrl: './poliza-seguro-drawer.component.less'
})
export class PolizaSeguroDrawerComponent {

  visible = model<boolean>(false)
  placement: NzDrawerPlacement = 'left';
  tituloDrawer = signal<string>("")
  PolizaSeguroCod = input<number>(0)
  $optionsCompaniaSeguro = this.searchService.getCompaniaSeguroSearch();
  private apiService = inject(ApiService)
  PersonalIdForEdit = signal(0)
  disabled = input<boolean>(false)


  constructor(private searchService: SearchService) { 
    
    effect(async() => { 
      const visible = this.visible()
      
      if (visible) {
        if (this.PolizaSeguroCod() > 0) {
          let vals = await firstValueFrom(this.apiService.getPolizaSeguro(this.PolizaSeguroCod()));
        
          vals.PolizaSeguroId = vals.PolizaSeguroCod

          this.formCli.patchValue(vals)
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
        this.PersonalIdForEdit.set(0)
        this.tituloDrawer.set(' Nuevo Poliza Seguro ')
      }
    })
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
