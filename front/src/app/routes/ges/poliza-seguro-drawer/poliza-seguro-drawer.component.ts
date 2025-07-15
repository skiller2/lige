import { Component, computed, effect, inject, input, model, output, signal, viewChild } from '@angular/core';
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
  PolizaSeguroNroPoliza = input<string>("")
  PolizaSeguroNroEndoso = input<string>("")
  CompaniaSeguroId = input<number>(0)
  TipoSeguroCodigo = input<string>("")
  isSaving = signal<boolean>(false)
  $optionsCompaniaSeguro = this.searchService.getCompaniaSeguroSearch();
  $optionsTipoSeguro = this.searchService.getTipoSeguroSearch();
  private apiService = inject(ApiService)
  disabled = input<boolean>(false)
  PolizaSeguroResultado = signal<any>(null)
  openDrawerConsult = input<boolean>(false)
  onRefreshPolizaSeguro = output<void>()
  fileUploadComponent = viewChild.required(FileUploadComponent);

  constructor(private searchService: SearchService) { 
    
    effect(async() => { 
      const visible = this.visible()
      
      if (visible) {
        if (this.PolizaSeguroNroPoliza() && this.PolizaSeguroNroEndoso() && this.CompaniaSeguroId() && this.TipoSeguroCodigo()) {
          let vals = await firstValueFrom(this.apiService.getPolizaSeguro(this.PolizaSeguroNroPoliza(), this.PolizaSeguroNroEndoso(), this.CompaniaSeguroId(), this.TipoSeguroCodigo()));
     
          this.PolizaSeguroResultado.set(JSON.parse(vals[0].PolizaSeguroResultado))
          this.formCli.patchValue(vals[0])
          this.formCli.markAsUntouched()
          this.formCli.markAsPristine()
  
          if(this.openDrawerConsult()) {
            this.formCli.disable()
            this.tituloDrawer.set(' Consulta Poliza Seguro ')
          }else{
            this.tituloDrawer.set(' Editar Poliza Seguro ')
            this.formCli.enable()
            this.enableForm()
          }
        
        }
      } else {
        this.formCli.reset()
        this.formCli.enable()
        this.enableForm()
        this.tituloDrawer.set(' Nueva Poliza Seguro ')
        this.PolizaSeguroResultado.set(null)
      }
    })
  }

  async save() {
    this.isSaving.set(true)
    let vals = this.formCli.value
    try {

      const res = await firstValueFrom(this.apiService.setPolizaSeguro(vals))
    
      if(res.data?.list?.PolizaSeguroCodigo) {

        this.formCli.patchValue({
          PolizaSeguroNroPoliza: res.data?.list?.PolizaSeguroNroPoliza,
          PolizaSeguroNroEndoso: res.data?.list?.PolizaSeguroNroEndoso,
          CompaniaSeguroId: res.data?.list?.CompaniaSeguroId,
          TipoSeguroCodigo: res.data?.list?.TipoSeguroCodigo,
          PolizaSeguroFechaEndoso: res.data?.list?.PolizaSeguroFechaEndoso
        })
        this.tituloDrawer.set('Editar Poliza Seguro')
      }  

      this.PolizaSeguroResultado.set(res.data?.list?.notFound)
      this.onRefreshPolizaSeguro.emit()
      this.fileUploadComponent().LoadArchivosAnteriores(res.data?.list?.DocumentoId)

      this.PolizaSeguroResultado.set(JSON.parse(res.data?.list?.PolizaSeguroResultado))
      this.formCli.markAsUntouched()
      this.formCli.markAsPristine()
      
    } catch (error) {
      // Handle error if needed
    }
    this.isSaving.set(false)
  }

  deletePoliza() {
    console.log("deletePoliza")
  }

  ngOnInit(){
  }

  async enableForm(){
    this.formCli.get('PolizaSeguroNroPoliza')?.disable()
    this.formCli.get('PolizaSeguroNroEndoso')?.disable()
    //this.formCli.get('PolizaSeguroFechaEndoso')?.disable()
  }


  fb = inject(FormBuilder)
  formCli = this.fb.group({
    id: 0,
    PolizaSeguroCodigo: "",
    TipoSeguroCodigo: "",
    DocumentoId: 0,
    CompaniaSeguroId: 0,
    PolizaSeguroNroPoliza: "",
    PolizaSeguroNroEndoso: "",
    PolizaSeguroFechaEndoso: "",
    PolizaSeguroAnio: 0,
    PolizaSeguroMes: 0,
    files: []
  })



}
