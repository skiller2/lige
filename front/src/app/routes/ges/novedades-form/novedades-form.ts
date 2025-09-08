import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import  { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import { Component, inject, ChangeDetectionStrategy,ViewEncapsulation, signal, input, output, model, viewChild } from '@angular/core';
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
  formChange$ = new BehaviorSubject('');
  fileUploadComponent = viewChild.required(FileUploadComponent);

  $selectedObjetivoIdChange = new BehaviorSubject(0)
  $optionsTipoNovedad = this.searchService.getTipoNovedad()

 fb = inject(FormBuilder)
  formCli = this.fb.group({
    ObjetivoId: 0,
    Fecha: null as Date | null,
    TipoNovedadId: 0,
    Descripcion: '',
    Accion: '',
    files: [],
    DocumentoId: 0
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
    
    this.formCli.markAsPristine()        

 }
  
  async load() {
    let infoObjetivo = await firstValueFrom(this.searchService.getNovedad(this.NovedadCodigo()))
console.log( "infoObjetivo", infoObjetivo)
    this.formCli.reset(infoObjetivo[0])
    this.formCli.patchValue({
      ObjetivoId: infoObjetivo[0].ObjetivoId,
      DocumentoId: infoObjetivo[0].DocumentoId || infoObjetivo[0].id
    })
  }


  async save() {
    this.loadingSrv.open({ type: 'spin', text: '' })
    let form = this.formCli.getRawValue();
    let DocumentoId = this.formCli.getRawValue().DocumentoId
    
    // Ajustar la fecha para evitar problemas de zona horaria
    if (form.Fecha) {
      const adjustedDate = this.adjustDateForTimezone(form.Fecha);
      if (adjustedDate) {
        (form as any).Fecha = adjustedDate;
      }
    }
    
    try {
        if (this.NovedadCodigo()) {

          let result = await firstValueFrom(this.apiService.updateNovedad(form, this.NovedadCodigo()))

          await this.load()

        } else {

          let result = await firstValueFrom(this.apiService.addNovedad(form))

          this.NovedadCodigo.set(result.data.NovedadCodigo || result.data.id || result.data.NovedadId)
          await this.load()
        } 
        this.onAddorUpdate.emit()
        this.formCli.markAsUntouched()
        this.formCli.markAsPristine()
        

    } catch (e) {
        console.error('Error al guardar novedad:', e)
    }
    this.formChange$.next("save") 
    this.loadingSrv.close()
}


async newRecord() {
  this.formCli.reset()
  this.NovedadCodigo.set(0)
  this.formCli.markAsPristine()
}


async deleteNovedad() {
  await firstValueFrom(this.apiService.deleteNovedad(this.NovedadCodigo()))

}


//esto ajusta la fecha para evitar problema que sume +3 horas cada vez que se guarda
private adjustDateForTimezone(date: Date | string): string | null {
  if (!date) return null
  
  let dateObj: Date
  if (typeof date === 'string') {
    dateObj = new Date(date)
  } else {
    dateObj = date
  }
  
  const utcDate = new Date(Date.UTC( dateObj.getFullYear(),dateObj.getMonth(),dateObj.getDate(),dateObj.getHours(), dateObj.getMinutes(), dateObj.getSeconds()))
  
  return utcDate.toISOString()
}

}
