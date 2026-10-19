import { Component, inject, signal, model, effect, computed, ChangeDetectionStrategy, input, resource } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../services/api.service';
import { SearchService } from '../../../../services/search.service';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { FileUploadComponent } from "../../../../shared/file-upload/file-upload.component";
import { NzCheckboxGroupComponent, NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { applyEach, disabled, FieldTree, form, FormField, required, submit, type ValidationError } from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AngularUtilService } from 'angular-slickgrid';

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
export interface Administrador {
  AdministradorId: number;
  // AdministradorApellido: string;
  // AdministradorNombre: string;
  AdministradorDenominacion: string;
  AdministradorNombreFantasia: string;
  // AdministradorSexo: string; 
  AdministradorInactivo: boolean;
  AdministradorSucursalId: number;
  contactos: Contacto[];
}

@Component({
  selector: 'app-administradores-form',
  templateUrl: './administradores-form.html',
  styleUrl: './administradores-form.less',
  imports: [...SHARED_IMPORTS, CommonModule, NzUploadModule, NzCheckboxModule,
    FormField, FormsModule,
  ],
  providers: [AngularUtilService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})

export class AdministradoresFormComponent {

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  isLoading = signal(false);
  administradorId = model<number>(0);
  crud = input<string>('');

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
  
  private readonly defaultAdministrador: Administrador= {
    AdministradorId: 0,
    // AdministradorApellido: '', 
    // AdministradorNombre: '', 
    AdministradorDenominacion: '', 
    AdministradorNombreFantasia: '', 
    // AdministradorSexo: '', 
    AdministradorInactivo: false, 
    AdministradorSucursalId: 0,
    contactos: [structuredClone(this.defaultContacto)],
  }

  readonly Administrador = signal<Administrador>(this.defaultAdministrador);

  readonly formAdministrador = form(this.Administrador, (p) => {
    disabled(p, () => this.crud() == 'R')
  })

  optionsSucursal = toSignal(this.searchService.getSucursales(), { initialValue: [] });
  optionsTipoContacto = toSignal(this.searchService.getTipoContacto(), { initialValue: [] as any[] })
  optionsJurImpositiva = toSignal(this.searchService.getJurImpositiva(), { initialValue: [] as any[] })
  optionsTipoTelefono = toSignal(this.searchService.getTipoTelefono(), { initialValue: [] as any[] })

  async ngOnInit() {}

  async load() {
    if (this.administradorId() > 0) {
      let infoAdministrador = await firstValueFrom(this.searchService.getAdministradorInfoById(this.administradorId()))
      // console.log('infoAdministrador: ', infoAdministrador)
      this.Administrador.update(m => ({
        ...m,
        ...infoAdministrador[0],
      }))
    }else{
      this.Administrador.set(this.defaultAdministrador)
    }
  }

  async save() {
    await submit(this.formAdministrador, async (form) => {
      this.isLoading.set(true)
      const values: any = form().value()
      try {
        const administradorId = values.AdministradorId
        //Filtra los array de los objeto no usados
        values.contactos = values.contactos.filter((c: Contacto) => { return !this.isEqualObject(c, this.defaultContacto) })
        if (administradorId) {
          await firstValueFrom(this.apiService.updateAdministrador(values))
        } else {
          const res = await firstValueFrom(this.apiService.addAdministrador(values))
          // this.administradorId.set(res.data.AdministradorId)
        }

        // this.load()
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

    this.Administrador.update(m => ({
      ...m,
      contactos: [...m.contactos, newFamiliar],
    }));
  }

  removeContacto(index: number, e: MouseEvent): void {
    e.preventDefault();
    this.Administrador.update(m => ({
      ...m,
      contactos: m.contactos.filter((_, i) => i !== index),
    }));

    if (this.Administrador().contactos.length == 0) {
      this.addContacto(undefined)
    }
  }

}