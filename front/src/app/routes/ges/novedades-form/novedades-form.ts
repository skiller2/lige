import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import { Component, inject, ChangeDetectionStrategy, ViewEncapsulation, signal, input, output, model, viewChild, computed } from '@angular/core';
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
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';

@Component({
  selector: 'app-novedades-form',
  imports: [SHARED_IMPORTS, CommonModule, FileUploadComponent, ObjetivoSearchComponent,
    NzSelectModule, NzAutocompleteModule, FormsModule, PersonalSearchComponent],
  templateUrl: './novedades-form.html',
  styleUrl: './novedades-form.less',
  providers: [ApiService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NovedadesFormComponent {

  periodo = signal<Date>(new Date())
  anio = computed(() => this.periodo() ? this.periodo().getFullYear() : 0)
  mes = computed(() => this.periodo() ? this.periodo().getMonth() + 1 : 0)
  auditHistory = signal<any[]>([])
  NovedadCodigo = model<number>(0)
  private readonly loadingSrv = inject(LoadingService)
  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  public router = inject(Router)
  onAddorUpdate = output<('save' | 'delete')>()
  formChange$ = new BehaviorSubject('');
  fileUploadComponent = viewChild.required(FileUploadComponent);

  $selectedObjetivoIdChange = new BehaviorSubject(0)
  $optionsTipoNovedad = this.searchService.getTipoNovedad()

  fb = inject(FormBuilder)
  formCli = this.fb.group({
    id: 0,
    ObjetivoId: 0,
    Fecha: null as Date | null,
    TipoNovedadId: 0,
    Descripcion: '',
    Accion: '',
    files: [],
    DocumentoId: 0,
    VisualizacionFecha: null as Date | null,
    VisualizacionPersonaNombre: '',
    VisualizacionTelefono: '',
    PersonalId: 0,
    Telefono: '',
  })

  objetivoDetalleChange(event: any) {
    this.$selectedObjetivoIdChange.next(event)
  }

  async viewRecord(readonly: boolean) {
    if (this.NovedadCodigo())
      await this.load()
    if (readonly) {
      this.formCli.disable()
    } else {
      this.formCli.enable()
    }
    this.formCli.get('id')?.disable()
    this.formCli.get('VisualizacionPersonaNombre')?.disable()
    this.formCli.get('VisualizacionTelefono')?.disable()
    this.formCli.get('VisualizacionFecha')?.disable()
    this.formCli.get('PersonalId')?.disable()
    this.formCli.get('Telefono')?.disable()
    this.formCli.markAsPristine()

  }

  async load() {
    let res = await firstValueFrom(this.searchService.getNovedad(this.NovedadCodigo()))
    const infoObjetivo = res[0]
    this.formCli.reset(infoObjetivo)
    this.formCli.patchValue({
      ObjetivoId: infoObjetivo.ObjetivoId,
      DocumentoId: infoObjetivo.DocumentoId || infoObjetivo.id
    })

    this.auditHistory.set([
      { usuario: infoObjetivo.AudUsuarioIng, fecha: this.formatDate(infoObjetivo.AudFechaIng), accion: 'Creación' },
      { usuario: infoObjetivo.AudUsuarioMod, fecha: this.formatDate(infoObjetivo.AudFechaMod), accion: 'Modificación' }
    ])
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
        console.log("voy a actualizar novedades")
        let result = await firstValueFrom(this.apiService.updateNovedad(form, this.NovedadCodigo()))
        await this.load()

      } else {
        console.log("voy a insertar novedades")
        let result = await firstValueFrom(this.apiService.addNovedad(form))
        this.NovedadCodigo.set(result.data.novedadId)
        await this.load()
      }
      this.onAddorUpdate.emit('save')
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
    this.formCli.get('id')?.disable()
    this.auditHistory.set([])
    this.formCli.markAsPristine()
  }


  async deleteNovedad() {
    await firstValueFrom(this.apiService.deleteNovedad(this.NovedadCodigo(), this.formCli.getRawValue().ObjetivoId))
    this.NovedadCodigo.set(0)
    this.onAddorUpdate.emit('delete')
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

    const utcDate = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), dateObj.getHours(), dateObj.getMinutes(), dateObj.getSeconds()))

    return utcDate.toISOString()
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${hours}:${minutes}:${seconds} ${day}-${month}-${year}`;
  }

}
