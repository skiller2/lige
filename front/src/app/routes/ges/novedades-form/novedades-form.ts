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
import { FormField, disabled, form, submit, readonly, hidden, required } from '@angular/forms/signals';

export interface Novedad {
  id: number;
  ObjetivoId: number|null;
  DocumentoId: number;
  Fecha: Date | null;
  TipoNovedadId: string;
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
  loading = signal<boolean>(false)

  optionsTipoNovedad = toSignal(this.searchService.getTipoNovedad(), { initialValue: [] });

  private readonly defaultNovedad:Novedad = {
    id: 0,
    ObjetivoId: null,
    Fecha: null as Date | null,
    TipoNovedadId: '',
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
  
  readonly parametroNovedad = signal<Novedad>({...this.defaultNovedad});

  readonly formNovedad = form(this.parametroNovedad, (p) => {
    disabled(p, () => this.crudAccion() === 'R')
    disabled(p.TipoNovedadId, () => true)
    disabled(p.PersonalId, () => !!this.NovedadCodigo())
    readonly(p.id, () => true)
    readonly(p.DescripcionNormalizada, () => true)
    readonly(p.AccionNormalizada, () => true)
    readonly(p.Telefono, () => true)
    readonly(p.VisualizacionPersonaNombre, () => true)
    readonly(p.VisualizacionTelefono, () => true)
    hidden(p.Telefono, ({ value }) => !value()?.trim());
    hidden(p.VisualizacionFecha, ({ value }) => !value());
    hidden(p.VisualizacionPersonaNombre, ({ value }) => !value()?.trim());
    hidden(p.VisualizacionTelefono, ({ value }) => !value()?.trim());
    required(p.ObjetivoId, { message: 'Objetivo es requerido', when: (ctx) => ctx.state.dirty() || ctx.state.touched(), })
    required(p.Fecha, { message: 'Fecha y Hora es requerido', when: (ctx) => ctx.state.dirty() || ctx.state.touched(), })
    required(p.Descripcion, { message: 'Descripción es requerido', when: (ctx) => ctx.state.dirty() || ctx.state.touched(), })
    required(p.Accion, { message: 'Acción es requerido', when: (ctx) => ctx.state.dirty() || ctx.state.touched(), })
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

    setTimeout(() => { this.formNovedad().reset() }, 200);   // Hack para resetear el estado de dirty/pristine después de cargar los datos, ya que el form no detecta que se cargaron nuevos datos y queda dirty
  }


  async save() {
    await submit(this.formNovedad, async (form) => {
      
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


      } catch (e: any) {
        return this.apiService.formBackendErrors(form, e.error?.data?.fieldErrors);
      }
      
      return undefined
    })
  }


  async newRecord() {
    this.NovedadCodigo.set(0)
    this.auditHistory.set([])
    this.parametroNovedad.set({...this.defaultNovedad})
    setTimeout(() => { this.formNovedad().reset() }, 200);
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

  async nomalizarNovedad(){
    const inputDescripcion = this.formNovedad.Descripcion()
    const Descripcion = inputDescripcion.value().trim();
    const inputAccion = this.formNovedad.Accion()
    const Accion = inputAccion.value().trim();

    // Solo llama a la IA si se modificó Descripción o Acción, o si falta algún normalizado
    const sinNormalizar = !this.formNovedad.DescripcionNormalizada().value() || !this.formNovedad.AccionNormalizada().value()
    if (this.loading() || (!Descripcion && !Accion) || !(inputDescripcion.dirty() || inputAccion.dirty() || sinNormalizar)) {
      return
    }

    this.loading.set(true)
    try {
      const res = await firstValueFrom(this.apiService.getDescripcionAccionNormalizada({Descripcion, Accion}));
      
      this.parametroNovedad.update(m => ({
        ...m,
        DescripcionNormalizada: res.data.DescripcionNormalizada || m.DescripcionNormalizada,
        AccionNormalizada: res.data.AccionNormalizada || m.AccionNormalizada,
        TipoNovedadId: res.data.TipoNovedad?.value,
      }))
      
    } catch (error) {
      
    }finally{
      this.loading.set(false)
    }
  }

}
