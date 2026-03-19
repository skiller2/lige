import { Component, Injector, inject, signal, model, effect, computed, ChangeDetectionStrategy, input, resource  } from '@angular/core';
import { BehaviorSubject, debounceTime, switchMap, firstValueFrom } from 'rxjs';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { FileUploadComponent } from "../../../shared/file-upload/file-upload.component";
import { NzCheckboxGroupComponent, NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { applyEach, disabled, FieldTree, form, FormField, required, submit, type ValidationError } from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

export interface Telefono {
  PersonalTelefonoId: number;
  TipoTelefonoId: number;
  TelefonoNro: string;
}

export interface Estudio {
  PersonalEstudioId: number;
  TipoEstudioId: number;
  EstadoEstudioId: number;
  EstudioTitulo: string;
  PersonalEstudioOtorgado: string;
  PersonalEstudioVencimiento: string;
  DocTitulo: any[];
  docId: number;
}

export interface Familiar {
  PersonalFamiliaId: number;
  Apellido: string;
  Nombre: string;
  TipoParentescoId: number;
}

export interface Beneficiario {
  Apellido: string;
  Nombre: string;
  TipoDocumentoId: number;
  DocumentoNro: number;
  TipoParentescoId: number;
  Observacion: string;
  Desde: string;
}

export interface Domicilio {
  Calle: string;
  Nro: string;
  Piso: string;
  Dpto: string;
  CodigoPostal: string;
  PaisId: number;
  ProvinciaId: number;
  LocalidadId: number;
  BarrioId: number;
  DomicilioId: number;
}

export interface ParametroPersonalForm {
  Nombre: string; Apellido: string;
  CUIT: number; NroLegajo: number; SucursalId: number;
  FechaNacimiento: string; NacionalidadId: number; Sexo: string; EstadoCivilId: number;
  FotoId: number; Foto: any[]|null,
  docDorsoId: number; docDorso: any[]|null;
  docFrenteId: number; docFrente: any[]|null;
  domicilio: Domicilio;
  PaisId: number; ProvinciaId: number; LocalidadId: number;
  PersonalEmailId: number; Email:string;
  telefonos: Telefono[];
  estudios: Estudio[];
  familiares: Familiar[];
  PersonalSituacionRevistaId: number; SituacionId: number; Motivo: string;
  LeyNro: number;
  habilitacion: any[];
  beneficiarios: Beneficiario[]
  TipoVehiculoId:number; VehiculoMarcaId:number; VehiculoMarcaModeloId:number;
  PersonalVehiculoPatente:string; Cilindrada:string;
  LugarFisicoLegajoId: number;
}

@Component({
    selector: 'app-personal-form',
    templateUrl: './personal-form.component.html',
    styleUrl: './personal-form.component.less',
    imports: [...SHARED_IMPORTS, CommonModule, NzUploadModule, FileUploadComponent, NzCheckboxModule,
      FormField, FormsModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
  
export class PersonalFormComponent {

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  // private injector = inject(Injector)
  isLoading = signal(false);
  panelAbiertos = signal<boolean[]>([false, false, false])
  periodo= signal({anio:0, mes:0})
  enableSelectReset = signal<boolean>(true)
  personalId = model<number>(0);
  readonly = input<boolean>(false);
  urlUpload = '/api/personal/upload'
  uploading$ = new BehaviorSubject({loading:false,event:null})

  optionsParentesco = signal<any[]>([])
  optionsTelefonoTipo = signal<any[]>([])
  optionsEstudioEstado = signal<any[]>([])
  optionsEstudioTipo = signal<any[]>([])
  optionsTipoDocumento = signal<any[]>([])
  
  //fb = inject(FormBuilder)
  private readonly objTelefono: Telefono = {PersonalTelefonoId:0, TipoTelefonoId:0, TelefonoNro:''}
  private readonly objEstudio: Estudio = {PersonalEstudioId:0, TipoEstudioId:0, EstadoEstudioId:0, EstudioTitulo:'', PersonalEstudioOtorgado:'', PersonalEstudioVencimiento:'', DocTitulo:[], docId:0}
  private readonly objFamiliar: Familiar = {PersonalFamiliaId:0, Apellido:'', Nombre:'', TipoParentescoId:0}
  private readonly objBeneficiario: Beneficiario = {Apellido:'', Nombre:'', TipoDocumentoId:0, DocumentoNro:NaN, TipoParentescoId:0, Observacion:'', Desde:''}
  private readonly objDomicilio: Domicilio = {Calle:'', Nro:'', Piso:'', Dpto:'', CodigoPostal:'', PaisId:0, ProvinciaId:0, LocalidadId:0, BarrioId:0, DomicilioId:0,}

  private readonly defaultPersonalForm: ParametroPersonalForm = { 
    Nombre:'', Apellido:'', CUIT:NaN, NroLegajo:NaN, SucursalId:0,
    FechaNacimiento:'', NacionalidadId:0, Sexo:'', EstadoCivilId:0,
    FotoId:0, Foto:[], docDorsoId:0, docDorso:[], docFrenteId: 0, docFrente:[],
    domicilio:   {...this.objDomicilio},
    PaisId:0, ProvinciaId:0, LocalidadId:0, //Lugar de nacimiento
    PersonalEmailId:0, Email:'', //Email
    telefonos:   [structuredClone(this.objTelefono)],
    estudios:    [structuredClone(this.objEstudio)],
    familiares:  [structuredClone(this.objFamiliar)],
    beneficiarios: [structuredClone(this.objBeneficiario)],
    PersonalSituacionRevistaId:0, SituacionId:0, Motivo:'', //Situacion de Revista
    LeyNro: NaN,
    habilitacion: [],
    TipoVehiculoId:3, VehiculoMarcaId:0, VehiculoMarcaModeloId:0,
    PersonalVehiculoPatente:'', Cilindrada:'',
    LugarFisicoLegajoId: 0,
  }
  
  // formPer = this.fb.group({ ...this.defaultPersonalForm })
  readonly parametroPersonal = signal<ParametroPersonalForm>(this.defaultPersonalForm);

  readonly formParametroPersonal = form(this.parametroPersonal, (p) => {
    disabled(p, () => this.readonly())
    // applyEach(p.telefonos, (telefono) => {
    //   disabled(telefono.TipoTelefonoId, () => this.readonly())
    //   disabled(telefono.TelefonoNro, () => this.readonly())
    // });
    // applyEach(p.estudios, (estudio) => {
    //   disabled(estudio.EstudioTitulo, () => this.readonly())
    // });
    // applyEach(p.familiares, (familiar) => {
    //   disabled(familiar.Apellido, () => this.readonly())
    //   disabled(familiar.Nombre, () => this.readonly())
    // });
    // applyEach(p.beneficiarios, (beneficiario) => {
    //   disabled(beneficiario.Apellido, () => this.readonly())
    //   disabled(beneficiario.Nombre, () => this.readonly())
    //   disabled(beneficiario.DocumentoNro, () => this.readonly())
    //   disabled(beneficiario.Observacion, () => this.readonly())
    // });
  })

  domicilio = computed(() => this.parametroPersonal().domicilio);

  optionsSucursal = toSignal(this.searchService.getSucursales(), { initialValue: [] });
  optionsNacionalidad = toSignal(this.searchService.getNacionalidadOptions(), { initialValue: [] });
  optionsSitRevista = toSignal(this.searchService.getSitRevistaOptions(), { initialValue: [] });
  optionsEstadoCivil = toSignal(this.searchService.getEstadoCivilOptions(), { initialValue: [] });
  optionsLugarHabilitacion = toSignal(this.searchService.getLugarHabilitacionOptions(), { initialValue: [] });
  optionsSexo = signal<any[]>([{value:'M', label:'MASCULINO'}, {value:'F', label:'FEMENINO'}])
  optionsTipoVehiculo = toSignal(this.searchService.getTiposVehiculoOptions(), { initialValue: [] });
  optionsUbicacionLegajo = toSignal(this.searchService.getUbicacionLegajoOptions(), { initialValue: [] });

  optionsPais = toSignal(this.searchService.getPaises(), { initialValue: [] });

  optionsDomicilioProvincia = resource({
    params: () => this.domicilio().PaisId,

    loader: async ({ params: PaisId }) => {
      
      if (!PaisId) {
        
        return [];
      }
      return await firstValueFrom(this.searchService.getProvinciasByPais(PaisId))
      
    }
  });

  optionsDomicilioLocalidad = resource({
    params: () => ({
      PaisId: this.domicilio().PaisId,
      ProvinciaId: this.domicilio().ProvinciaId,
    }),

    loader: async ({ params }) => {
      
      if (!params.PaisId || !params.ProvinciaId) {
        return [];
      }
      return await firstValueFrom(this.searchService.getLocalidadesByProvincia(params.PaisId, params.ProvinciaId))
    
    }
  });

  optionsDomicilioBarrio = resource({
    params: () => ({
      PaisId: this.domicilio().PaisId,
      ProvinciaId: this.domicilio().ProvinciaId,
      LocalidadId: this.domicilio().LocalidadId
    }),

    loader: async ({ params }) => {
      
      if (!params.PaisId || !params.ProvinciaId || !params.LocalidadId) {
        return [];
      }
      return await firstValueFrom(this.searchService.getBarriosByLocalidad(params.PaisId, params.ProvinciaId, params.LocalidadId));
      
    }
  });

  optionsProvincia = resource({
    params: () => this.parametroPersonal().PaisId,

    loader: async ({ params: PaisId }) => {
      if (!PaisId) {
        return [];
      }
      return await firstValueFrom(this.searchService.getProvinciasByPais(PaisId))
    }
  });

  optionsLocalidad = resource({
    params: () => ({
      PaisId: this.parametroPersonal().PaisId,
      ProvinciaId: this.parametroPersonal().ProvinciaId,
    }),

    loader: async ({ params }) => {
      if (!params.PaisId || !params.ProvinciaId) {
        return [];
      }
      return await firstValueFrom(this.searchService.getLocalidadesByProvincia(params.PaisId, params.ProvinciaId))
      
    }
  });

  optionsMarcaVehiculo = resource({
    params: () => ({
      // TipoVehiculoId: this.parametroPersonal().TipoVehiculoId,
      TipoVehiculoId: 3,
    }),

    loader: async ({ params }) => {
      if (!params.TipoVehiculoId) {
        return [];
      }
      return await firstValueFrom(this.searchService.getMarcasVehiculo(params.TipoVehiculoId))
      
    }
  });

  optionsModeloVehiculo = resource({
    params: () => ({
      TipoVehiculoId: 3, // Forzar siempre valor 3
      VehiculoMarcaId: this.parametroPersonal().VehiculoMarcaId,
    }),

    loader: async ({ params }) => {
      if (!params.TipoVehiculoId || !params.VehiculoMarcaId) {
        return [];
      }
      return await firstValueFrom(this.searchService.getModelosVehiculo(params.TipoVehiculoId, params.VehiculoMarcaId))
      
    }
  });

  effect = effect(() => {
    let objDomicilio:any = {}
    let objLugarNacimiento:any = {}
    const domPaisId = this.parametroPersonal().domicilio.PaisId
    const domProvinciaId = this.parametroPersonal().domicilio.ProvinciaId
    const domLocalidadId = this.parametroPersonal().domicilio.LocalidadId
    const domBarrioId = this.parametroPersonal().domicilio.BarrioId
    const lugNacPaisId = this.parametroPersonal().PaisId
    const lugNacProvinciaId = this.parametroPersonal().ProvinciaId
    const lugNacLocalidadId = this.parametroPersonal().LocalidadId
    if (this.enableSelectReset()) {
      
      if (!domLocalidadId && domBarrioId){
        objDomicilio.BarrioId = 0
      } else if (!domProvinciaId && (domLocalidadId || domBarrioId)){
        objDomicilio.LocalidadId = 0
        objDomicilio.BarrioId = 0
      } else if (!domPaisId && (domProvinciaId || domLocalidadId || domBarrioId)){
        objDomicilio.ProvinciaId = 0
        objDomicilio.LocalidadId = 0
        objDomicilio.BarrioId = 0
      }

      if (!lugNacProvinciaId && lugNacLocalidadId){
        objLugarNacimiento.LocalidadId = 0
      } else if (!lugNacPaisId && (lugNacProvinciaId || lugNacLocalidadId)){
        objLugarNacimiento.ProvinciaId = 0
        objLugarNacimiento.LocalidadId = 0
      }
      
      if (Object.keys(objDomicilio).length || Object.keys(objLugarNacimiento).length) {
        this.parametroPersonal.update(m => ({
          ...m, 
          domicilio: { ...m.domicilio, ...objDomicilio},
          ...objLugarNacimiento
        }));
      }
      
    }

    // if (this.readonly()) {
    //   this.formParametroPersonal().disable({ emitEvent: false });   // disables all controls
    // } else {
    //   this.formParametroPersonal.enable({ emitEvent: false });
    // }
  });

  async ngOnInit(){
    let now : Date = new Date()
    this.periodo.set({anio: now.getFullYear(), mes: now.getMonth()+1})
    
    const optionsTelefonoTipo = await firstValueFrom(this.searchService.getTipoTelefonoOptions())
    const optionsEstudioEstado = await firstValueFrom(this.searchService.getEstadoEstudioOptions())
    const optionsEstudioTipo = await firstValueFrom(this.searchService.getTipoEstudioOptions())
    const optionsParentesco = await firstValueFrom(this.searchService.getTipoParentescoOptions())
    const optionsTipoDocumento = await firstValueFrom(this.searchService.getTipoDocumentoOptions())
    
    this.optionsTelefonoTipo.set(optionsTelefonoTipo)
    this.optionsEstudioEstado.set(optionsEstudioEstado)
    this.optionsEstudioTipo.set(optionsEstudioTipo)
    this.optionsParentesco.set(optionsParentesco)
    this.optionsTipoDocumento.set(optionsTipoDocumento)
  }

  async load() {
    this.enableSelectReset.set(false)
    if (this.personalId()) {
      let infoPersonal = await firstValueFrom(this.searchService.getPersonalInfoById(this.personalId()))

      if (!infoPersonal.telefonos.length) infoPersonal.telefonos = [structuredClone(this.objTelefono)]
      if (!infoPersonal.estudios.length) infoPersonal.estudios = [structuredClone(this.objEstudio)]
      if (!infoPersonal.familiares.length) infoPersonal.familiares = [structuredClone(this.objFamiliar)]
      if (!infoPersonal.beneficiarios.length) infoPersonal.beneficiarios = [structuredClone(this.objBeneficiario)]
      
      this.parametroPersonal.update(m => ({
        ...m,
        ...infoPersonal,
        TipoVehiculoId: 3 // Forzar siempre valor 3
      }))

      setTimeout(() => { this.formParametroPersonal().reset() }, 400);
    }
    
    this.enableSelectReset.set(true)
  }

  async save() {
    await submit(this.formParametroPersonal, async (form) => {
    this.isLoading.set(true)
    const values:any = form().value()
    try {
      //Filtra los array de los objeto no usados
      values.telefonos = values.telefonos.filter((t:Telefono) => { return !this.isEqualObject(t, this.objTelefono) })
      values.estudios = values.estudios.filter((e:Estudio) => { return !this.isEqualObject(e, this.objEstudio) })
      values.familiares = values.familiares.filter((f:Familiar) => { return !this.isEqualObject(f, this.objFamiliar) })
      values.beneficiarios = values.beneficiarios.filter((b:Beneficiario) => { return !this.isEqualObject(b, this.objBeneficiario) })
            
      // Asegurar que LugarFisicoLegajoId sea un valor simple o null
      if (Array.isArray(values.LugarFisicoLegajoId)) {
        values.LugarFisicoLegajoId = values.LugarFisicoLegajoId[0] || null;
      }
      
      
      if (this.personalId()) {
        await firstValueFrom( this.apiService.updatePersonal(this.personalId(), values))
      }else{
        const res = await firstValueFrom(this.apiService.addPersonal(values))
        this.personalId.set(res.data.PersonalId)
      }

      this.load()      
      // this.formParametroPersonal().reset()
    } catch (e) {
      
    }
    this.isLoading.set(false)
    })
  }

  addTelefono(e?: MouseEvent): void {
    e?.preventDefault();

    const newTelefono = structuredClone(this.objTelefono)

    this.parametroPersonal.update(m => ({
      ...m,
      telefonos: [...m.telefonos, newTelefono],
    }));
  }

  addEstudio(e?: MouseEvent): void {
    e?.preventDefault();

    const newEstudio = structuredClone(this.objEstudio)

    this.parametroPersonal.update(m => ({
      ...m,
      estudios: [...m.estudios, newEstudio],
    }));
  }

  addFamiliar(e?: MouseEvent): void {
    e?.preventDefault();

    const newFamiliar = structuredClone(this.objFamiliar)

    this.parametroPersonal.update(m => ({
      ...m,
      familiares: [...m.familiares, newFamiliar],
    }));
  }

  addBeneficiario(e?: MouseEvent): void {
    e?.preventDefault();

    const newBeneficiario = structuredClone(this.objBeneficiario)

    this.parametroPersonal.update(m => ({
      ...m,
      beneficiarios: [...m.beneficiarios, newBeneficiario],
    }));
  }

  removeTelefono(index: number, e: MouseEvent): void {
    e.preventDefault();
    this.parametroPersonal.update(m => ({
      ...m,
      telefonos: m.telefonos.filter((_, i) => i !== index),
    }));

    if (this.parametroPersonal().telefonos.length == 0) {
      this.addTelefono(undefined)
    }
  }

  removeEstudio(index: number, e: MouseEvent): void {
    e.preventDefault();
    this.parametroPersonal.update(m => ({
      ...m,
      estudios: m.estudios.filter((_, i) => i !== index),
    }));

    if (this.parametroPersonal().estudios.length == 0) {
      this.addEstudio(undefined)
    }
  }

  removeFamiliar(index: number, e: MouseEvent): void {
    e.preventDefault();
    this.parametroPersonal.update(m => ({
      ...m,
      familiares: m.familiares.filter((_, i) => i !== index),
    }));

    if (this.parametroPersonal().familiares.length == 0) {
      this.addFamiliar(undefined)
    }
  }

  removeBeneficiario(index: number, e: MouseEvent): void {
    e.preventDefault();
    this.parametroPersonal.update(m => ({
      ...m,
      beneficiarios: m.beneficiarios.filter((_, i) => i !== index),
    }));

    if (this.parametroPersonal().beneficiarios.length == 0) {
      this.addBeneficiario(undefined)
    }
  }

  async newRecord() {
    if (!this.formParametroPersonal().dirty()) {
      this.personalId.set(0)
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