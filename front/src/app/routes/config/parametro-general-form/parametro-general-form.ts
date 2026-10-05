import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { disabled, form, FormField, required, submit } from '@angular/forms/signals';

export interface ParametroGeneralForm {
  ParametroGeneralCodigo: string;
  Parametros: string;
}

@Component({
  selector: 'app-parametro-general-form',
  standalone: true,
  imports: [SHARED_IMPORTS, CommonModule, FormField],
  templateUrl: './parametro-general-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParametroGeneralFormComponent {

  soloLectura = input<boolean>(false)

  // '' = alta; con código = editar/detalle de ese parámetro
  ParametroGeneralCodigo = input<string>('')

  parametroGeneralGuardado = output<string>()

  private apiService = inject(ApiService)

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
  })

  uppercaseEffect = effect(() => {
    const value = this.parametroGeneral().ParametroGeneralCodigo;
    if (value && value !== value.toUpperCase()) {
      this.parametroGeneral.update(m => ({ ...m, ParametroGeneralCodigo: value.toUpperCase() }));
    }
  });

  async load(ParametroGeneralCodigo: string) {
    const parametroGeneral = await firstValueFrom(this.apiService.getParametroGeneral(ParametroGeneralCodigo))
    this.parametroGeneral.update(m => ({ ...m, ...parametroGeneral }))
    this.codigoCargado.set(this.parametroGeneral().ParametroGeneralCodigo)

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
