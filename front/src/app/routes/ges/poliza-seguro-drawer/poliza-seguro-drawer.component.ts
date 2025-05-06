import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { FormBuilder } from '@angular/forms';
import { SearchService } from '../../../services/search.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import  { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';


interface ArchivoConDatos {
  dataInFile: {
    poliza: string;
    endoso: string;
    fechaInicio: string;
  };
}

@Component({
  selector: 'app-poliza-seguro-drawer',
  imports: [SHARED_IMPORTS, NzUploadModule, NzDescriptionsModule, ReactiveFormsModule, CommonModule, FileUploadComponent, FormsModule, NzInputModule],
  templateUrl: './poliza-seguro-drawer.component.html',
  styleUrl: './poliza-seguro-drawer.component.less'
})

export class PolizaSeguroDrawerComponent {

  visible = model<boolean>(false)
  placement: NzDrawerPlacement = 'left';
  tituloDrawer = signal<string>("")
  PolizaSeguroCodigo = input<string>("")
  isSaving = signal<boolean>(false)
  $optionsCompaniaSeguro = this.searchService.getCompaniaSeguroSearch();
  $optionsTipoSeguro = this.searchService.getTipoSeguroSearch();
  private apiService = inject(ApiService)
  disabled = input<boolean>(false)


  constructor(private searchService: SearchService) { 
    
    effect(async() => { 
      const visible = this.visible()
      
      if (visible) {
        if (this.PolizaSeguroCodigo()) {
          let vals = await firstValueFrom(this.apiService.getPolizaSeguro(this.PolizaSeguroCodigo()));
        
          this.formCli.patchValue(vals[0])
          this.formCli.markAsUntouched()
          this.formCli.markAsPristine()
  
        
          this.tituloDrawer.set(' Editar Poliza Seguro ')
          //this.formCli.disable()
        
        }
      } else {
        this.formCli.reset()
       //this.formCli.disable()
        this.tituloDrawer.set(' Nueva Poliza Seguro ')
      }
    })
  }

  async save() {
    this.isSaving.set(true)
    let vals = this.formCli.value
    try {
    
      const res = await firstValueFrom(this.apiService.setPolizaSeguro(vals))
      if(res.data?.list[0]?.PolizaSeguroCodigo) {
       
        this.formCli.patchValue({
          PolizaSeguroCodigo: res.data?.list[0]?.PolizaSeguroCodigo,
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

  ngOnInit(){
    //this.formCli.valueChanges.subscribe(value => {
    //  console.log("value.files", value.files)
    //  if (value.files && (value.files as ArchivoConDatos[]).length > 0) {
    //    this.formCli.patchValue({
    //      PolizaSeguroNroPoliza: (value.files as ArchivoConDatos[])[0].dataInFile.poliza,  
    //      PolizaSeguroNroEndoso: (value.files as ArchivoConDatos[])[0].dataInFile.endoso,
    //      PolizaSeguroFechaEndoso: (value.files as ArchivoConDatos[])[0].dataInFile.fechaInicio
    //    })
    //  }
    //});
  }


  fb = inject(FormBuilder)
  formCli = this.fb.group({
    id: 0,
    PolizaSeguroCodigo: "",
    TipoSeguroId: 0,
    CompaniaSeguroId: 0,
    PolizaSeguroNroPoliza: "",
    PolizaSeguroNroEndoso: "",
    PolizaSeguroFechaEndoso: "",
    files: []
  })



}
