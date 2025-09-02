import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import  { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import { Component, inject, ChangeDetectionStrategy,ViewEncapsulation, signal, input, output, model } from '@angular/core';
import { NgForm, FormArray, FormBuilder, ValueChangeEvent } from '@angular/forms';
import { SearchService } from 'src/app/services/search.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { ApiService } from 'src/app/services/api.service';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoadingService } from '@delon/abc/loading';

@Component({
  selector: 'app-novedades-form',
  imports: [  SHARED_IMPORTS, CommonModule, FileUploadComponent, ObjetivoSearchComponent, NzSelectModule, NzAutocompleteModule, FormsModule],
  templateUrl: './novedades-form.html',
  styleUrl: './novedades-form.less',
  providers: [ApiService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NovedadesFormComponent {


  NovedadCodigo = model<number>(0)
  private readonly loadingSrv = inject(LoadingService)
  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  public router = inject(Router)
  onAddorUpdate = output()

  $selectedObjetivoIdChange = new BehaviorSubject(0)
  $optionsTipoNovedad = this.searchService.getTipoNovedad()

 fb = inject(FormBuilder)
  formCli = this.fb.group({
    ObjetivoId: 0,
    Fecha: null,
    TipoNovedadId: 0,
    Descripcion: '',
    Accion: '',
    files: []

  })

  objetivoDetalleChange(event: any){
    this.$selectedObjetivoIdChange.next(event)
  }

  async viewRecord(readonly:boolean) {
    if (this.NovedadCodigo()) 
      await this.load()
    if (readonly){
      this.formCli.disable()
    }else{
      this.formCli.enable()
    }
    this.formCli.get('ObjetivoId')?.disable()
    this.formCli.markAsPristine()        

 }
  
  async load() {
    let infoObjetivo = await firstValueFrom(this.searchService.getNovedad(this.NovedadCodigo()))

    console.log("infoObjetivo", infoObjetivo)
    this.formCli.reset(infoObjetivo[0])
  }


  async save() {
    this.loadingSrv.open({ type: 'spin', text: '' })
    let form = this.formCli.getRawValue();
    try {
        if (this.NovedadCodigo()) {

          // este es para cuando es update

          let result = await firstValueFrom(this.apiService.updateNovedad(form, this.NovedadCodigo()))
        
        } else {
          // este es para cuando es un nuevo registro

          let result = await firstValueFrom(this.apiService.addNovedad(form))
           console.log("result", result)
          this.formCli.patchValue({
          });

          
        }
        this.onAddorUpdate.emit()
        this.formCli.markAsUntouched()
        this.formCli.markAsPristine()
    } catch (e) {
        
    }
    this.loadingSrv.close()
}


async newRecord() {
  this.formCli.reset()
  this.NovedadCodigo.set(0)
  this.formCli.markAsPristine()
}



}
