import { Component, inject, signal, model, effect, computed, ChangeDetectionStrategy, input, untracked } from '@angular/core';
import { BehaviorSubject, debounceTime, switchMap, firstValueFrom } from 'rxjs';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../services/api.service';
import { SearchService } from '../../../../services/search.service';
import { NzUploadModule } from 'ng-zorro-antd/upload';
// import { FileUploadComponent } from "../../../../shared/file-upload/file-upload.component";
import { applyEach, disabled, FieldTree, form, FormField, required, submit, type ValidationError } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { AddrSearchComponent } from "../../../../shared/addr-search/addr-search";
import { toSignal } from '@angular/core/rxjs-interop';

export interface ProveedorForm {
  ProveedorId: number;
  ProveedorRazonSocial: string;
  CUIT: number;
  domicilio: any;
  ProveedorInactivo: number;
  ContactoApellido: string;
  ContactoNombre: string;
  ContactoEmailEmail: string;
  TipoTelefonoId: number;
  ContactoTelefonoNro: string;
}

@Component({
  selector: 'app-proveedores-form',
  templateUrl: './proveedores-form.html',
  styleUrl: './proveedores-form.less',
  imports: [...SHARED_IMPORTS, CommonModule, NzUploadModule, FormField, FormsModule, AddrSearchComponent ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProveedoresFormComponent {

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  isLoading = signal(false);
  ProveedorId = model<number>(0);
  crudAccion = input<string>('');
  
  private readonly defaultProveedorForm: ProveedorForm = {
    ProveedorId: 0,
    ProveedorRazonSocial: '',
    CUIT: NaN,
    ProveedorInactivo: 0,
    domicilio: {},
    ContactoApellido: '',
    ContactoNombre: '',
    ContactoEmailEmail: '',
    ContactoTelefonoNro: '',
    TipoTelefonoId: 0,
  }

  readonly parametroProveedor = signal<ProveedorForm>(this.defaultProveedorForm);

  readonly formParametroProveedor = form(this.parametroProveedor, (p) => {
    disabled(p, () => this.crudAccion() === 'R')
  })

  tipoTelefono = toSignal(this.searchService.getTipoTelefono(), { initialValue: [] as any[] })

  async load() {
    if (this.ProveedorId()) {
      let infoProveedor = await firstValueFrom(this.searchService.getProveedorInfoById(this.ProveedorId()))

      this.parametroProveedor.update(m => ({
        ...m,
        ...infoProveedor,
      }))

      setTimeout(() => { this.formParametroProveedor().reset() }, 100);
      return;
    }
  }

  async save() {
    await submit(this.formParametroProveedor, async (form) => {
      this.isLoading.set(true)
      const values: any = form().value()
      console.log('form: ', values);
      
      try {
        if (this.ProveedorId()) {
          // await firstValueFrom(this.apiService.updateProveedorId(this.ProveedorId(), values))
        } else {
          // const res = await firstValueFrom(this.apiService.addProveedorId(values))
          // this.ProveedorId.set(res.data.ProveedorId)
        }
      } catch (e) {

      }
      this.isLoading.set(false)
    })
  }

}