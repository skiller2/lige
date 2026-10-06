import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { firstValueFrom } from 'rxjs';
import { NzCodeEditorModule } from 'ng-zorro-antd/code-editor';
import { LoadingService } from '@delon/abc/loading';
import { ApiService } from '../../../services/api.service';
import { disabled, form, FormField, required, submit, validate } from '@angular/forms/signals';

export interface ParametroGeneralForm {
  ParametroGeneralCodigo: string;
  Parametros: string;
}

@Component({
  selector: 'app-parametro-general-form',
  standalone: true,
  imports: [SHARED_IMPORTS, CommonModule, FormField, NzCodeEditorModule],
  templateUrl: './parametro-general-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParametroGeneralFormComponent {

  soloLectura = input<boolean>(false)

  // '' = alta; con código = editar/detalle de ese parámetro
  ParametroGeneralCodigo = input<string>('')

  parametroGeneralGuardado = output<string>()

  private apiService = inject(ApiService)
  private readonly loadingSrv = inject(LoadingService)

  // Código del parámetro cargado desde la base: el código es la clave y lo carga el usuario, así
  // que es lo que distingue el alta de la modificación (en orden-venta lo hace el número en cero)
  private readonly codigoCargado = signal('')

  private readonly defaultParametroGeneral: ParametroGeneralForm = {
    ParametroGeneralCodigo: '',
    Parametros: '',
  }

  readonly parametroGeneral = signal<ParametroGeneralForm>(this.defaultParametroGeneral);

  readonly formParametroGeneral = form(this.parametroGeneral, (p) => {
    disabled(p, () => { return (this.soloLectura()) })
    // La clave no se modifica una vez grabada
    disabled(p.ParametroGeneralCodigo, () => this.codigoCargado() != '')
    required(p.ParametroGeneralCodigo, { message: 'Código es requerido' });
    required(p.Parametros, { message: 'Parámetros es requerido' });
    // Si tiene forma de JSON tiene que ser un JSON válido, igual que valida el back
    validate(p.Parametros, (ctx) => {
      const valor = String(ctx.value() ?? '').trim()
      if (!valor.startsWith('{') && !valor.startsWith('[')) return undefined
      try {
        JSON.parse(valor)
        return undefined
      } catch (e) {
        return { kind: 'json', message: `JSON inválido: ${e instanceof Error ? e.message : String(e)}` }
      }
    });
  })

  // Con contenido JSON se edita en Monaco; si no, en el textarea
  esJson = computed(() => /^\s*[{[]/.test(this.parametroGeneral().Parametros ?? ''))

  uppercaseEffect = effect(() => {
    const value = this.parametroGeneral().ParametroGeneralCodigo;
    if (value && value !== value.toUpperCase()) {
      this.parametroGeneral.update(m => ({ ...m, ParametroGeneralCodigo: value.toUpperCase() }));
    }
  });

  async load(ParametroGeneralCodigo: string) {
    // Con JSON el spinner sigue hasta que Monaco termina de crear el editor (editorListo). Si el
    // editor ya estaba (se recarga después de guardar) no se vuelve a crear: se cierra al final.
    const habiaEditor = this.esJson()
    this.loadingSrv.open({ type: 'spin', text: '' })
    const parametroGeneral = await firstValueFrom(this.apiService.getParametroGeneral(ParametroGeneralCodigo))
    this.parametroGeneral.update(m => ({ ...m, ...parametroGeneral }))
    // El JSON se guarda compacto: para editarlo se muestra con sangría. Si no es un JSON válido
    // queda tal cual, para no perder lo que haya grabado.
    const parametros = this.parametroGeneral().Parametros ?? ''
    if (/^\s*[{[]/.test(parametros)) {
      try {
        const formateado = JSON.stringify(JSON.parse(parametros), null, 2)
        this.parametroGeneral.update(m => ({ ...m, Parametros: formateado }))
      } catch (_e) { }
    }
    this.codigoCargado.set(this.parametroGeneral().ParametroGeneralCodigo)
    if (!this.esJson() || habiaEditor)
      this.loadingSrv.close()

    setTimeout(() => { this.formParametroGeneral().reset() }, 200);   // Hack para resetear el estado de dirty/pristine después de cargar los datos, ya que el form no detecta que se cargaron nuevos datos y queda dirty
  }

  async save() {
    if (this.soloLectura() || this.formParametroGeneral().submitting() || this.formParametroGeneral().dirty() == false || this.formParametroGeneral().valid() == false) return undefined

    await submit(this.formParametroGeneral, async (form) => {
      try {
        const formValue = form().value();
        const respuesta = await firstValueFrom(this.apiService.setParametroGeneral(formValue, this.codigoCargado() == ''))
        await this.load(respuesta.data.ParametroGeneralCodigo)
        this.parametroGeneralGuardado.emit(respuesta.data.ParametroGeneralCodigo)
      } catch (e: any) {
        return this.apiService.formBackendErrors(form, e.error?.data?.fieldErrors);
      }
      return undefined
    })
  }

  // Monaco terminó de crear el editor: se cierra el spinner que abrió load()
  editorListo() {
    this.loadingSrv.close()
  }

  clearForm(): void {
    this.parametroGeneral.set(structuredClone(this.defaultParametroGeneral))
    this.codigoCargado.set('')
    this.formParametroGeneral().reset();
  }

  private lastParametroGeneralCodigo: string | null = null
  private effecto = effect(() => {
    const ParametroGeneralCodigo = this.ParametroGeneralCodigo()
    if (this.lastParametroGeneralCodigo !== ParametroGeneralCodigo) {
      if (ParametroGeneralCodigo) {
        this.load(ParametroGeneralCodigo);
      } else {
        this.clearForm()
      }
      this.lastParametroGeneralCodigo = ParametroGeneralCodigo
    }
  })
}
