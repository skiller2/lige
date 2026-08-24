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

export interface Contacto {
  ContactoId: number;
  ContactoNombre: string;
  ContactoApellido: string;
  ContactoArea: string;
  ContactoJurImpositiva: string;
  ContactoTipoCod: string;
  
  TipoTelefonoId: number;
  ContactoTelefonoNro: string;

  ContactoEmailEmail: string;
}
export interface ProveedorForm {
  ProveedorId: number;
  ProveedorRazonSocial: string;
  CUIT: number;
  domicilio: any;
  ProveedorInactivo: number;
  contactos: Contacto[];
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

  private readonly defaultContacto:Contacto = {
    ContactoId: 0,
    ContactoNombre: "",
    ContactoApellido: "",
    ContactoArea: "",
    TipoTelefonoId: 0,
    ContactoTelefonoNro: "",
    ContactoEmailEmail: "",
    ContactoTipoCod:"",
    ContactoJurImpositiva:""
  }
  
  private readonly defaultProveedorForm: ProveedorForm = {
    ProveedorId: 0,
    ProveedorRazonSocial: '',
    CUIT: NaN,
    ProveedorInactivo: 0,
    domicilio: {},
    contactos: [structuredClone(this.defaultContacto)],
  }

  readonly parametroProveedor = signal<ProveedorForm>(this.defaultProveedorForm);

  readonly formParametroProveedor = form(this.parametroProveedor, (p) => {
    disabled(p, () => this.crudAccion() === 'R')
  })

  optionsTipoContacto = toSignal(this.searchService.getTipoContacto(), { initialValue: [] as any[] })
  optionsJurImpositiva = toSignal(this.searchService.getJurImpositiva(), { initialValue: [] as any[] })
  optionsTipoTelefono = toSignal(this.searchService.getTipoTelefono(), { initialValue: [] as any[] })

  async load() {
    if (this.ProveedorId()) {
      let infoProveedor = await firstValueFrom(this.searchService.getProveedorInfoById(this.ProveedorId()))

      if (!infoProveedor.contactos.length) infoProveedor.contactos = [structuredClone(this.defaultContacto)]

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
        //Filtra los array de los objeto no usados
        values.contactos = values.telefonos.filter((c: Contacto) => { return !this.isEqualObject(c, this.defaultContacto) })
        if (this.ProveedorId()) {
          // await firstValueFrom(this.apiService.updateProveedorId(this.ProveedorId(), values))
        } else {
          // const res = await firstValueFrom(this.apiService.addProveedor(values))
          // this.ProveedorId.set(res.data.ProveedorId)
        }
        this.load()
      } catch (e) {

      }
      this.isLoading.set(false)
    })
  }

  isEqualObject(a: any, b: any): boolean {
    return Object.keys(b).every(key => {
      const valA = a[key];
      const valB = b[key];

      if (Array.isArray(valB)) {
        return Array.isArray(valA) && valA.length === valB.length;
      }

      if (Number.isNaN(valB)) {
        return Number.isNaN(valA);
      }

      return valA === valB;
    });
  }

  addContacto(e?: MouseEvent): void {
    e?.preventDefault();

    const newFamiliar = structuredClone(this.defaultContacto)

    this.parametroProveedor.update(m => ({
      ...m,
      contactos: [...m.contactos, newFamiliar],
    }));
  }

  removeContacto(index: number, e: MouseEvent): void {
    e.preventDefault();
    this.parametroProveedor.update(m => ({
      ...m,
      contactos: m.contactos.filter((_, i) => i !== index),
    }));

    if (this.parametroProveedor().contactos.length == 0) {
      this.addContacto(undefined)
    }
  }

}