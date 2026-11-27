import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, inject, viewChild, ChangeDetectionStrategy, signal, model, input, output, Signal, effect } from '@angular/core';
import { AngularUtilService } from 'angular-slickgrid';
import { SHARED_IMPORTS } from '@shared';
import { ApiService } from '../../../services/api.service';
import { AdministradorSearchComponent } from '../../../shared/administrador-search/administrador-search.component';
import { firstValueFrom } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import { Router } from '@angular/router';
import { TableClienteDocumentoComponent } from '../../../routes/ges/table-cliente-documentos/table-cliente-documentos';
import { AddrSearchComponent } from "../../../shared/addr-search/addr-search";
import { toSignal } from '@angular/core/rxjs-interop';
import { applyEach, disabled, form, FormField, readonly, required, submit } from '@angular/forms/signals';

interface Domicilio {
  DomicilioId: number;
  Domicilio: any;
  DomicilioDomLugar: string;
}
interface Contacto {
  ContactoId: number;
  nombre: string;
  ContactoApellido: string;
  area: string;
  TipoTelefonoId: number|null;
  telefono: string;
  correo: string;
  ContactoEmailId: number;
  ContactoTelefonoId: number;
  ContactoTipoCod: string;
  ContactoJurImpositiva: string;
}
interface Cliente {
  id: number;
  ClienteFacturacionCUIT: number;
  ClienteFacturacionId: number;
  CondicionAnteIVAId: number;
  CondicionAnteIVADescripcion: string;
  ClienteDenominacion: string;
  ClienteNombreFantasia: string;
  ClienteFechaAlta: string;
  ClienteTerminoPago: number;
  ContactoTelefonoUltNro: number;
  ContactoEmailUltNro: number;
  MaxContactoId: number;
  AdministradorId: number;
  ClienteAdministradorUltNro: number;
  infoClienteContacto: Contacto[];
  infoClienteContactoOriginal: Contacto[];
  infoDomicilio: Domicilio[];
  estado: number;
  files: any[];
  PermiteDescargaRecibos: boolean;
  codigo: string;
}

@Component({
    selector: 'app-clientes-form',
    templateUrl: './clientes-form.component.html',
    styleUrl: './clientes-form.component.less',
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [
        SHARED_IMPORTS,
        CommonModule,
        AdministradorSearchComponent,
        NzAutocompleteModule,
        NzSelectModule,
        FileUploadComponent,
        TableClienteDocumentoComponent,
        AddrSearchComponent,
        FormField,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})


export class ClientesFormComponent {
  public router = inject(Router);
  isLoadSelect = signal(false)
  periodo = signal({ year: 0, month: 0 })
  ClienteId = input(0)
  isLoading = signal(false)
  onAddorUpdate = output<number | null>()
  crudAccion = input<string>('');
  mostrarDocs = model<boolean>(false)

  //files = []
  textForSearch = "Cliente"

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  
  private readonly clienteContactoDefault:Contacto = {
    ContactoId: 0,
    nombre: "",
    ContactoApellido: "",
    area: "",
    TipoTelefonoId: null,
    telefono: "",
    correo: "",
    ContactoEmailId: 0,
    ContactoTelefonoId: 0,
    ContactoTipoCod:"",
    ContactoJurImpositiva:""
  }

  private readonly domiclioDefault: Domicilio = {
    DomicilioId: 0,
    Domicilio: null,
    DomicilioDomLugar: '',
  }

  private readonly clienteDefault: Cliente ={
    id: 0,
    ClienteFacturacionCUIT: NaN,
    ClienteFacturacionId: 0,
    CondicionAnteIVAId: 0,
    CondicionAnteIVADescripcion: "",
    ClienteDenominacion: "",
    ClienteNombreFantasia: "",
    ClienteFechaAlta: "",
    ClienteTerminoPago: NaN,
    ContactoTelefonoUltNro: 0,
    ContactoEmailUltNro: 0,
    MaxContactoId: 0,
    AdministradorId: 0, ClienteAdministradorUltNro: 0, 
    infoClienteContacto: [structuredClone(this.clienteContactoDefault )],
    infoClienteContactoOriginal: [structuredClone(this.clienteContactoDefault )],
    infoDomicilio: [structuredClone(this.domiclioDefault)],
    estado: 0,
    files: [],
    PermiteDescargaRecibos: false,
    codigo: ""
  }

  readonly cliente = signal<Cliente>({...this.clienteDefault});
  readonly formCliente = form(this.cliente, (p) => {
    disabled(p, () => this.crudAccion() === 'R');
    readonly(p.codigo, () => true);
    required(p.ClienteFacturacionCUIT, { message: 'CUIT es requerido', when: (ctx) => ctx.state.dirty() || ctx.state.touched(), })
    required(p.ClienteFechaAlta, { message: 'Fecha Inicial es requerida', when: (ctx) => ctx.state.dirty() || ctx.state.touched(), })
    required(p.ClienteNombreFantasia, { message: 'Nombre Fantasia es requerido', when: (ctx) => ctx.state.dirty() || ctx.state.touched(), })
    required(p.ClienteTerminoPago, { message: 'Termino Pago es requerido', when: (ctx) => ctx.state.dirty() || ctx.state.touched(), })
    required(p.CondicionAnteIVAId, { message: 'Condición ante IVA es requerido', when: (ctx) => ctx.state.dirty() || ctx.state.touched(), })
    required(p.ClienteDenominacion, { message: 'Razón Social es requerido', when: (ctx) => ctx.state.dirty() || ctx.state.touched(), })
    applyEach(p.infoDomicilio, (domicilioPath) => {
      required(domicilioPath.Domicilio, 
        { message: 'Dirección es requerido', when: (ctx) => ctx.state.dirty() || ctx.state.touched(), });
    });
    applyEach(p.infoClienteContacto, (contactoPath) => {
      required(contactoPath.ContactoTipoCod, 
        { message: 'Tipo de contacto es requerido', when: (ctx) => !!(
          ctx.valueOf(contactoPath.ContactoJurImpositiva) || 
          ctx.valueOf(contactoPath.nombre) || 
          ctx.valueOf(contactoPath.ContactoApellido)), });
      required(contactoPath.ContactoJurImpositiva, 
        { message: 'Comision es requerido', when: (ctx) => !!(
          ctx.valueOf(contactoPath.ContactoTipoCod) ||
          ctx.valueOf(contactoPath.nombre) || 
          ctx.valueOf(contactoPath.ContactoApellido)), });
      required(contactoPath.nombre, 
        { message: 'Nombre es requerido', when: (ctx) => !!(
          ctx.valueOf(contactoPath.ContactoTipoCod) ||
          ctx.valueOf(contactoPath.ContactoJurImpositiva) || 
          ctx.valueOf(contactoPath.ContactoApellido)), });
      required(contactoPath.ContactoApellido, 
        { message: 'Apellido es requerido', when: (ctx) => !!(
          ctx.valueOf(contactoPath.ContactoTipoCod) ||
          ctx.valueOf(contactoPath.ContactoJurImpositiva) || 
          ctx.valueOf(contactoPath.nombre)), });
      required(contactoPath.TipoTelefonoId, 
        { message: 'Tipo Telefono es requerido', when: (ctx) => !!(
          ctx.valueOf(contactoPath.telefono)
        ), });
    });
  })

  optionsTipoTelefono = toSignal(this.searchService.getTipoTelefono(), { initialValue: [] });
  optionsCondicionAnteIva = toSignal(this.searchService.getOptionsCondicionAnteIva(), { initialValue: [] });
  optionTipoContacto = toSignal(this.searchService.getTipoContacto(), { initialValue: [] });
  optionJurImpositiva = toSignal(this.searchService.getJurImpositiva(), { initialValue: [] });

  childDocsGrid = viewChild.required<TableClienteDocumentoComponent>('docsGrid')

  onChangePeriodo = effect(() => {
    const ClienteFechaAlta = this.cliente().ClienteFechaAlta
    if (ClienteFechaAlta) {
      const date = new Date(ClienteFechaAlta)
      this.periodo.set({ year: date.getFullYear(), month: date.getMonth() + 1 })
    } else {
      this.periodo.set({ year: 0, month: 0 })
    }
  })

  async ngOnInit() {}

  resetForm() {
    this.cliente.update(m => ({
      ...this.clienteDefault
    }))
    setTimeout(() => { this.formCliente().reset() }, 400);
  }

  async newRecord() {
    if (!this.formCliente().dirty()) {

      setTimeout(() => { this.formCliente().reset() }, 400);
    }
  }

  async viewRecord() {
    if (this.ClienteId())
      await this.load()
  }

  async load() {
    // this.files = []

    let infoCliente = await firstValueFrom(this.searchService.getInfoObjCliente(this.ClienteId()))
    // console.log('infoCliente: ', infoCliente);

    if (!infoCliente.infoClienteContacto.length) {
      infoCliente.infoCoordinadorCuenta = [{ ...this.clienteContactoDefault }]
    }
    if (!infoCliente.infoDomicilio.length) {
      infoCliente.infoActividad = [{ ...this.domiclioDefault }]
    }

    // if (this.ClienteId()) {
    //   this.infoClienteContacto().enable()
    //   this.infoDomicilio().enable()
    //   if (infoCliente.infoClienteContacto.length == 0)
    //     this.infoClienteContacto().push(this.fb.group({ ...this.objClienteContacto }))

    //   if (infoCliente.infoDomicilio.length == 0)
    //     this.infoDomicilio().push(this.fb.group({ ...this.objDomiclio }))

    // } else {
    //   this.infoDomicilio().disable()
    //   this.infoClienteContacto().disable()
    // }
    
    this.cliente.update(m => ({
      ...m,
      ...infoCliente,
      codigo: infoCliente.id,
    }));
    setTimeout(() => { this.formCliente().reset() }, 400);
  
  }

  async save() {
    await submit(this.formCliente, async (form) => {
      this.isLoading.set(true)
      let value = {...form().value()};
      const isNewCliente = !value.id
      try {
        value.infoClienteContacto = value.infoClienteContacto.filter((contacto:any)=>{
          return (contacto.ContactoTipoCod || contacto.ContactoJurImpositiva || contacto.nombre || contacto.ContactoApellido || contacto.telefono || contacto.TipoTelefonoId)   
        })
        if (value.id) { //UPDATE
          let result = await firstValueFrom(this.apiService.updateCliente(value, this.cliente().id))
          
          this.cliente.update(m => ({
            ...m,
            ...result
          }));

        } else { //INSERT (nuevo registro)

          let result = await firstValueFrom(this.apiService.addCliente(value))
          const infoCliente = result.data
          if (!infoCliente.infoDomicilio.length) {
            infoCliente.infoDomicilio = [{ ...this.domiclioDefault }]
          }
          if (!infoCliente.infoClienteContacto.length) {
            infoCliente.infoClienteContacto = [{ ...this.clienteContactoDefault }]
          }

          this.cliente.update(m => ({
            ...m,
            ...infoCliente,
          }));

          this.mostrarDocs.set(true)
        }

        if (this.mostrarDocs()) {
          this.childDocsGrid().refreshGrid()
        }

        this.onAddorUpdate.emit(this.cliente().id)

        if (isNewCliente && this.cliente().id) {
          await this.router.navigate(['/ges/clientes/editar'])
        }
      } catch (e:any) {
        console.log('fieldErrors: ', e.error?.data?.fieldErrors);
        
        return this.apiService.formBackendErrors(form, e.error?.data?.fieldErrors);
      } finally {
        this.isLoading.set(false)
      }
      return undefined
    })
  }

  addDomicilio(e?: MouseEvent): void {
    e?.preventDefault();

    const newDomicilio = structuredClone(this.domiclioDefault)

    this.cliente.update(m => ({
      ...m,
      infoDomicilio: [...m.infoDomicilio, newDomicilio],
    }));
  }

  removeDomicilio(index: number, e: MouseEvent): void {
    e.preventDefault();
    this.cliente.update(m => ({
      ...m,
      infoDomicilio: m.infoDomicilio.filter((_, i) => i !== index),
    }));

    if (this.cliente().infoDomicilio.length == 0) {
      this.addDomicilio(undefined)
    }
  }

  addClienteContacto(e?: MouseEvent): void {
    e?.preventDefault();

    const newClienteContacto = structuredClone(this.clienteContactoDefault)

    this.cliente.update(m => ({
      ...m,
      infoClienteContacto: [...m.infoClienteContacto, newClienteContacto],
    }));

  }

  removeClienteContacto(index: number, e: MouseEvent): void {
    e.preventDefault();
    this.cliente.update(m => ({
      ...m,
      infoClienteContacto: m.infoClienteContacto.filter((_, i) => i !== index),
    }));

    if (this.cliente().infoClienteContacto.length == 0) {
      this.addClienteContacto(undefined)
    }
  }

  async deleteCliente() {
    const ClienteId = this.cliente().id
    if (!ClienteId) return

    this.isLoading.set(true)
    try {
      await firstValueFrom(this.apiService.deleteCliente(ClienteId))
      this.onAddorUpdate.emit(null)
      await this.router.navigate(['/ges/clientes/listado'])
    } finally {
      this.isLoading.set(false)
    }
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

}
