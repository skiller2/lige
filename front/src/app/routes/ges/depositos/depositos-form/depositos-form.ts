import { Component, inject, signal, model, effect, computed, ChangeDetectionStrategy, input, untracked, output } from '@angular/core';
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
import { NzCheckboxModule, NzCheckboxOption } from 'ng-zorro-antd/checkbox';

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
export interface DepositoForm {
  DepositoId: number;
  DepositoNombre: string;
  DepositoSucursalId: number;
  DomicilioId: number;
  domicilio: any;
  DepositoInactivo: number;
  IndRequiereObservacion: number;
  contactos: Contacto[];
}

@Component({
  selector: 'app-depositos-form',
  templateUrl: './depositos-form.html',
  styleUrl: './depositos-form.less',
  imports: [...SHARED_IMPORTS, CommonModule, NzUploadModule, FormField, FormsModule, AddrSearchComponent, NzCheckboxModule ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DepositosFormComponent {

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  isLoading = signal(false);
  DepositoId = model<number>(0);
  crudAccion = input<string>('');
  onAddorUpdate = output()

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
  
  private readonly defaultDepositoForm: DepositoForm = {
    DepositoId: 0,
    DepositoNombre: '',
    DepositoSucursalId: NaN,
    DepositoInactivo: 0,
    IndRequiereObservacion: 0,
    DomicilioId: 0,
    domicilio: null,
    contactos: [structuredClone(this.defaultContacto)],
  }

  readonly parametroDeposito = signal<DepositoForm>(this.defaultDepositoForm);

  readonly formParametroDeposito = form(this.parametroDeposito, (p) => {
    disabled(p, () => this.crudAccion() === 'R')
  })

  optionsSucursal = toSignal(this.searchService.getSucursales(), { initialValue: [] });
  optionsTipoContacto = toSignal(this.searchService.getTipoContacto(), { initialValue: [] as any[] })
  optionsJurImpositiva = toSignal(this.searchService.getJurImpositiva(), { initialValue: [] as any[] })
  optionsTipoTelefono = toSignal(this.searchService.getTipoTelefono(), { initialValue: [] as any[] })

  async load() {
    if (this.DepositoId()) {
      let infoDeposito = await firstValueFrom(this.searchService.getDepositoInfoById(this.DepositoId()))

      if (!infoDeposito.contactos.length) infoDeposito.contactos = [structuredClone(this.defaultContacto)]

      this.parametroDeposito.update(m => ({
        ...m,
        ...infoDeposito,
      }))

      setTimeout(() => { this.formParametroDeposito().reset() }, 100);
      return;
    }
  }

  async save() {
    await submit(this.formParametroDeposito, async (form) => {
      this.isLoading.set(true)
      const values: any = form().value()
      try {
        //Filtra los array de los objeto no usados
        values.contactos = values.contactos.filter((c: Contacto) => { return !this.isEqualObject(c, this.defaultContacto) })
        if (this.DepositoId()) {
          await firstValueFrom(this.apiService.updateDeposito(values))
        } else {
          const res = await firstValueFrom(this.apiService.addDeposito(values))
          this.DepositoId.set(res.data.DepositoId)
        }
        this.load()
        this.onAddorUpdate.emit()
      } catch (e) {
        if (!values.contactos.length) values.contactos = [structuredClone(this.defaultContacto)]
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

    this.parametroDeposito.update(m => ({
      ...m,
      contactos: [...m.contactos, newFamiliar],
    }));
  }

  removeContacto(index: number, e: MouseEvent): void {
    e.preventDefault();
    this.parametroDeposito.update(m => ({
      ...m,
      contactos: m.contactos.filter((_, i) => i !== index),
    }));

    if (this.parametroDeposito().contactos.length == 0) {
      this.addContacto(undefined)
    }
  }

  // async setDepositoInactivo() {
  //   try {
  //     await firstValueFrom(this.apiService.bajaDepositoInactivo(this.DepositoId()))
  //     this.load()
  //     this.onAddorUpdate.emit()
  //   } catch (e) {
      
  //   }
  // }

}