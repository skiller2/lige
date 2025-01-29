import { Component, Injector, viewChild, inject, signal, model, computed, ChangeDetectionStrategy, effect, input } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, noop, firstValueFrom } from 'rxjs';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { NgForm, FormArray, FormBuilder } from '@angular/forms';
import { NzUploadChangeParam, NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"

@Component({
  selector: 'app-personal-form',
  templateUrl: './personal-form.component.html',
  styleUrl: './personal-form.component.less',
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule, NzUploadModule, FileUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
  
export class PersonalFormComponent {

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private injector = inject(Injector)
  isLoading = signal(false);
  periodo= signal({anio:0, mes:0})
  enableSelectReset = signal<boolean>(true)
  personalId = model<number>(0);
  readonly = input<boolean>(false);
  urlUpload = '/api/personal/upload'
  uploading$ = new BehaviorSubject({loading:false,event:null});

  optionsParentesco = signal<any[]>([])
  optionsTelefonoTipo = signal<any[]>([])
  optionsEstudioEstado = signal<any[]>([])
  optionsEstudioTipo = signal<any[]>([])
  
  fb = inject(FormBuilder)
  objTelefono = {PersonalTelefonoId:0, TipoTelefonoId:0, TelefonoNro:''}
  objEstudio = {PersonalEstudioId:0, TipoEstudioId:0, EstadoEstudioId:0, EstudioTitulo:'', EstudioAno:null, DocTitulo:[]}
  objFamiliar = {PersonalFamiliaId:0, Apellido:'', Nombre:'', TipoParentescoId:0}

  inputs = { 
    Nombre:'', Apellido:'', CUIT:null, NroLegajo:null, SucursalId:0, FechaIngreso:'',
    FechaNacimiento:'', Foto:[], NacionalidadId:0, docDorso:[], docFrente:[],
    Calle:'', Nro:'', Piso:'', Dpto:'', //Domicilio
    CodigoPostal:'', PaisId:0, ProvinciaId:0, //Domicilio
    LocalidadId:0, BarrioId:0, PersonalDomicilioId:0,//Domicilio
    PersonalEmailId:0, Email:'', //Email
    telefonos: this.fb.array([this.fb.group({...this.objTelefono})]),
    estudios: this.fb.array([this.fb.group({...this.objEstudio})]),
    familiares : this.fb.array([this.fb.group({...this.objFamiliar})]),
    PersonalSituacionRevistaId:0, SituacionId:0, Motivo:'', //Situacion de Revista
  }
  
  formPer = this.fb.group({ ...this.inputs })

  $optionsSucursal = this.searchService.getSucursales();
  $optionsNacionalidad = this.searchService.getNacionalidadOptions();
  $optionsSitRevista = this.searchService.getSitRevistaOptions();

  foto():string {
    const value = this.formPer.get("Foto")?.value
    if(value) return value
    else return ''
  }
  docDorso():string {
    const value = this.formPer.get("docDorso")?.value
    if(value) return value
    else return ''
  }
  docFrente():string {
    const value = this.formPer.get("docFrente")?.value
    if(value) return value
    else return ''
  }
  paisId():number {
    const value = this.formPer.get("PaisId")?.value
    if(value) return value
    else return 0
  }
  provinciaId():number {
      const value = this.formPer.get("ProvinciaId")?.value
      if(value) return value
      else return 0
  }
  localidadId():number {
      const value = this.formPer.get("LocalidadId")?.value
      if(value) return value
      else return 0
  }
  telefonos():FormArray {
    return this.formPer.get("telefonos") as FormArray
  }
  estudios():FormArray {
    return this.formPer.get("estudios") as FormArray
  }
  familiares():FormArray {
    return this.formPer.get("familiares") as FormArray
  }

  $selectedLocalidadIdChange = new BehaviorSubject('');
  $selectedProvinciaIdChange = new BehaviorSubject('');
  $selectedPaisIdChange = new BehaviorSubject('');

  $optionsPais = this.searchService.getPaises();

  $optionsProvincia = this.$selectedPaisIdChange.pipe(
      debounceTime(500),
      switchMap(() =>{
          return this.searchService.getProvinciasByPais(this.paisId())
      })
  );
  $optionsLocalidad = this.$selectedProvinciaIdChange.pipe(
      debounceTime(500),
      switchMap(() =>{
          return this.searchService.getLocalidadesByProvincia(this.paisId(), this.provinciaId())
      })
  );
  $optionsBarrio = this.$selectedLocalidadIdChange.pipe(
    debounceTime(500),
    switchMap(() =>{
        return this.searchService.getBarriosByLocalidad(this.paisId(), this.provinciaId(), this.localidadId())
    })
  );

  async ngOnInit(){
    let now : Date = new Date()
    this.periodo.set({anio: now.getFullYear(), mes: now.getMonth()+1})
    let optionsTelefonoTipo = await firstValueFrom(this.searchService.getTipoTelefonoOptions())
    let optionsEstudioEstado = await firstValueFrom(this.searchService.getEstadoEstudioOptions())
    let optionsEstudioTipo = await firstValueFrom(this.searchService.getTipoEstudioOptions())
    let optionsParentesco = await firstValueFrom(this.searchService.getTipoParentescoOptions())
    
    this.optionsTelefonoTipo.set(optionsTelefonoTipo)
    this.optionsEstudioEstado.set(optionsEstudioEstado)
    this.optionsEstudioTipo.set(optionsEstudioTipo)
    this.optionsParentesco.set(optionsParentesco)
  }

  async load() {
    this.enableSelectReset.set(false)
    this.formPer.enable()
    if (this.personalId()) {
      let infoPersonal = await firstValueFrom(this.searchService.getPersonalInfoById(this.personalId()))
      let values:any = {...this.inputs}
      // console.log('infoPersonal: ', infoPersonal);
      
      for (const key in values) {
        values[key] = infoPersonal[key]
      }
      this.telefonos().clear()
      this.estudios().clear()
      this.familiares().clear()

      infoPersonal.telefonos.forEach((obj:any) => {
          this.telefonos().push(this.fb.group({...this.objTelefono}))
      });
      if (this.telefonos().length == 0)
          this.telefonos().push(this.fb.group({...this.objTelefono}))
      
      infoPersonal.estudios.forEach((obj:any) => {
          this.estudios().push(this.fb.group({...this.objEstudio}))
      });
      if (this.estudios().length == 0)
          this.estudios().push(this.fb.group({...this.objEstudio}))
      
      infoPersonal.familiares.forEach((obj:any) => {
        this.familiares().push(this.fb.group({...this.objFamiliar}))
      });
      if (this.familiares().length == 0)
          this.familiares().push(this.fb.group({...this.objFamiliar}))

      this.formPer.reset(values)
      // console.log(this.formPer.value);

      this.formPer.controls.PersonalSituacionRevistaId.disable()
      this.formPer.controls.SituacionId.disable()
      this.formPer.controls.Motivo.disable()
    }
    
    this.enableSelectReset.set(true)
    if (this.readonly())
      this.formPer.disable()
  }

  async save() {
    this.isLoading.set(true)
    const values:any = this.formPer.value
    // console.log('values', values);
    try {
      if (this.personalId()) {
        await firstValueFrom( this.apiService.updatePersonal(this.personalId(), values))
      }else{
        const res = await firstValueFrom(this.apiService.addPersonal(values))
        this.personalId.set(res.data.PersonalId)

      }

      this.load()      
      this.formPer.markAsUntouched()
      this.formPer.markAsPristine()
    } catch (e) {
      
    }
    this.isLoading.set(false)
  }

  selectedPaisChange(event: any):void{
    if (this.enableSelectReset()){
      this.formPer.get('ProvinciaId')?.reset()
      this.formPer.get('LocalidadId')?.reset()
      this.formPer.get('BarrioId')?.reset()
    }
    this.$selectedPaisIdChange.next('')
    this.$selectedProvinciaIdChange.next('')
    this.$selectedLocalidadIdChange.next('')
  }

  selectedProvinciaChange(event: any):void{
    if (this.enableSelectReset()){
      this.formPer.get('LocalidadId')?.reset()
      this.formPer.get('BarrioId')?.reset()
    }
    this.$selectedProvinciaIdChange.next('')
    this.$selectedLocalidadIdChange.next('')
  }

  selectedLocalidadChange(event: any):void{
    if (this.enableSelectReset()) 
      this.formPer.get('BarrioId')?.reset()
    this.$selectedLocalidadIdChange.next('')
  }

  addTelefono(e?: MouseEvent): void {
    e?.preventDefault();
    this.telefonos().push(this.fb.group({...this.objTelefono}))
  }

  addEstudio(e?: MouseEvent): void {
    e?.preventDefault();
    this.estudios().push(this.fb.group({...this.objEstudio}))
  }

  addFamiliar(e?: MouseEvent): void {
    e?.preventDefault();
    this.familiares().push(this.fb.group({...this.objEstudio}))
  }

  removeTelefono(index: number, e: MouseEvent): void {
    e.preventDefault();
    if (this.telefonos().controls.length > 1 ) {
        this.telefonos().removeAt(index)
    }
  }

  removeEstudio(index: number, e: MouseEvent): void {
    e.preventDefault();
    if (this.estudios().controls.length > 1 ) {
        this.estudios().removeAt(index)
    }
  }

  removeFamiliar(index: number, e: MouseEvent): void {
    e.preventDefault();
    if (this.familiares().controls.length > 1 ) {
        this.familiares().removeAt(index)
    }
  }

}