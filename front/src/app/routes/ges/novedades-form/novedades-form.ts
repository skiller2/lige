import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import { Component, inject, ChangeDetectionStrategy, ViewEncapsulation, signal, input, output, model, viewChild, computed } from '@angular/core';
import { NgForm, FormArray, FormBuilder, ValueChangeEvent } from '@angular/forms';
import { SearchService } from '../../../services/search.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { ApiService } from '../../../services/api.service';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoadingService } from '@delon/abc/loading';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormField, disabled, form, submit, readonly, hidden } from '@angular/forms/signals';

export interface Novedad {
  id: number;
  ObjetivoId: number;
  DocumentoId: number;
  Fecha: Date | null;
  TipoNovedadId: number;
  Descripcion: string;
  Accion: string;
  DescripcionNormalizada: string;
  AccionNormalizada: string;
  PersonalId: number;
  Telefono: string;
  VisualizacionFecha: Date | null;
  VisualizacionPersonaNombre: string;
  VisualizacionTelefono: string;
  files: any[];
}

@Component({
  selector: 'app-novedades-form',
  imports: [SHARED_IMPORTS, CommonModule, FileUploadComponent, ObjetivoSearchComponent,
    NzSelectModule, NzAutocompleteModule, FormsModule, PersonalSearchComponent, FormField],
  templateUrl: './novedades-form.html',
  styleUrl: './novedades-form.less',
  providers: [ApiService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NovedadesFormComponent {

  private readonly loadingSrv = inject(LoadingService)
  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  public router = inject(Router)

  periodo = signal<Date>(new Date())
  anio = computed(() => this.periodo() ? this.periodo().getFullYear() : 0)
  mes = computed(() => this.periodo() ? this.periodo().getMonth() + 1 : 0)
  auditHistory = signal<any[]>([])
  NovedadCodigo = model<number>(0)
  onAddorUpdate = output<('save' | 'delete')>()
  crudAccion = input<string>('');

  optionsTipoNovedad = toSignal(this.searchService.getTipoNovedad(), { initialValue: [] });

  private readonly defaultNovedad:Novedad = {
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
    DescripcionNormalizada: '',
    AccionNormalizada: '',
  }
  
  readonly parametroNovedad = signal<Novedad>(this.defaultNovedad);

  readonly formNovedad = form(this.parametroNovedad, (p) => {
    disabled(p, () => this.crudAccion() === 'R')
    readonly(p.id, () => true)
    readonly(p.DescripcionNormalizada, () => true)
    readonly(p.AccionNormalizada, () => true)
    readonly(p.VisualizacionPersonaNombre, () => true)
    readonly(p.VisualizacionTelefono, () => true)
    hidden(p.Telefono, ({ value }) => !value()?.trim());
    hidden(p.VisualizacionFecha, ({ value }) => !value());
    hidden(p.VisualizacionPersonaNombre, ({ value }) => !value()?.trim());
    hidden(p.VisualizacionTelefono, ({ value }) => !value()?.trim());
  })

  async viewRecord() {
    if (this.NovedadCodigo())
      await this.load()
  }

  async load() {
    let res = await firstValueFrom(this.searchService.getNovedad(this.NovedadCodigo()))
    // console.log('infoNovedad: ',res)
    const infoNovedad = res[0]
    // this.formNovedad().reset(infoNovedad)
    this.parametroNovedad.update(m => ({
      ...m,
      ...infoNovedad,
      // DocumentoId: infoNovedad.DocumentoId || infoNovedad.id
    }))

    this.auditHistory.set([
      { usuario: infoNovedad.AudUsuarioIng, fecha: this.formatDate(infoNovedad.AudFechaIng), accion: 'Creación' },
      { usuario: infoNovedad.AudUsuarioMod, fecha: this.formatDate(infoNovedad.AudFechaMod), accion: 'Modificación' }
    ])
  }


  async save() {
    await submit(this.formNovedad, async (form) => {
      this.loadingSrv.open({ type: 'spin', text: '' })
      const values: any = form().value()

      // Ajustar la fecha para evitar problemas de zona horaria
      if (values.Fecha) {
        const adjustedDate = this.adjustDateForTimezone(values.Fecha);
        if (adjustedDate) {
          (values as any).Fecha = adjustedDate;
        }
      }

      try {
        if (this.NovedadCodigo()) {
          
          await firstValueFrom(this.apiService.updateNovedad(values, this.NovedadCodigo()))

        } else {
          
          let result = await firstValueFrom(this.apiService.addNovedad(values))
          this.NovedadCodigo.set(result.data.novedadId)
        }
        await this.load()
        this.onAddorUpdate.emit('save')


      } catch (e) {}
      this.loadingSrv.close()
    })
  }


  async newRecord() {
    this.parametroNovedad.set(this.defaultNovedad)
    this.NovedadCodigo.set(0)
    this.auditHistory.set([])
  }


  async deleteNovedad() {
    await firstValueFrom(this.apiService.deleteNovedad(this.NovedadCodigo(), this.parametroNovedad().ObjetivoId))
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
