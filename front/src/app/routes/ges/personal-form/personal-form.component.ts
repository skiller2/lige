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
import  { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"

const tipoArchivo = [
  {
    label:'Foto',
    value:7
  },{
    label:'docFrente',
    value:12
  },{
    label:'docDorso',
    value:13
  }
]

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
  files = signal<any[]>([])
  enableSelectReset = signal<boolean>(true)
  personalId = input(0);
  private notification = inject(NzNotificationService)
  urlUpload = '/api/personal/upload'
  uploading$ = new BehaviorSubject({loading:false,event:null});
  
  fb = inject(FormBuilder)
  objTelefono = {PersonalTelefonoId:0, LugarTelefonoId:0, TipoTelefonoId:0, CodigoPais:'', CodigoArea:'', TelefonoNro:''}
  objEstudio = {PersonalEstudioId:0, TipoEstudioId:0, EstadoEstudioId:0, EstudioTitulo:'', EstudioAno:null}
  inputs = { 
    Nombre:'', Apellido:'', CUIT:null, NroLegajo:null, SucursalId:0, FechaIngreso:'',
    FechaNacimiento:'', Foto:'', NacionalidadId:0, docDorso:'', docFrente:'',
    Calle:'', Nro:'', Piso:'', Dpto:'', Esquina:'', EsquinaY:'', //Domicilio
    Bloque:'', Edificio:'', Cuerpo:'', CodigoPostal:'', PaisId:0, ProvinciaId:0, //Domicilio
    LocalidadId:0, BarrioId:0, PersonalDomicilioId:0,//Domicilio
    telefonos: this.fb.array([this.fb.group({...this.objTelefono})]),
    estudios: this.fb.array([this.fb.group({...this.objEstudio})]),
  }
  
  formPer = this.fb.group({ ...this.inputs })

  $optionsSucursal = this.searchService.getSucursales();
  $optionsNacionalidad = this.searchService.getNacionalidadList();
  $optionsTelefonoLugar = this.searchService.getLugarTelefonoList();
  $optionsTelefonoTipo = this.searchService.getTipoTelefonoList();
  $optionsEstudioEstado = this.searchService.getEstadoEstudioList();
  $optionsEstudioTipo = this.searchService.getTipoEstudioList();

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
    // effect(async () => {
    //   if (this.personalId()) {
    //       await this.load()
    //   } else {
          
    //   }
    // }, { injector: this.injector });
  }

  async load() {
    this.enableSelectReset.set(false)
    let infoPersonal = await firstValueFrom(this.searchService.getPersonalInfoById(this.personalId()))
    let values:any = {...this.inputs}
    
    for (const key in values) {
      values[key] = infoPersonal[key]
    }
    this.telefonos().clear()
    this.estudios().clear()

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

    this.formPer.reset(values)
    console.log(this.formPer.value);
    console.log(this.paisId(), this.provinciaId(), this.localidadId());
    
    

    let arrayFiles : any[] = []
    if (infoPersonal.Foto){arrayFiles.push({ fieldname: infoPersonal.Foto, originalname: infoPersonal.Foto, save:true})}
    if (infoPersonal.docDorso){arrayFiles.push({ fieldname: infoPersonal.docDorso, originalname: infoPersonal.docDorso, save:true})}
    if (infoPersonal.docFrente){arrayFiles.push({ fieldname: infoPersonal.docFrente, originalname: infoPersonal.docFrente, save:true})}
    this.files.set(arrayFiles)
    this.enableSelectReset.set(true)
  }

  uploadChange(event: any, input:string) {
    switch (event.type) {
      case 'start':
        
        this.uploading$.next({ loading: true, event })
    
        break;
      case 'progress':
        debugger
        break;
      case 'error':
        const Error = event.file.error
        if (Error.error.data?.list) {
        }
        this.uploading$.next({ loading:false,event })
        break;
      case 'success':
        const Response = event.file.response
        Response.data[0].save = false
        Response.data[0].control = input

        this.files.set([ ...this.files(), Response.data[0] ])
        // console.log(this.files());
        this.formPer.get(input)?.setValue(Response.data[0].fieldname)
  
        this.uploading$.next({ loading: false, event })
        this.apiService.response(Response) 

        this.formPer.markAsTouched()
        this.formPer.markAsDirty()
        this.propagateChange(this.files())
        break
      default:
        break;
    }

  }

  private propagateChange: (_: any) => void = noop

  registerOnChange(fn: any) {
    this.propagateChange = fn
  }

  async save() {
    this.isLoading.set(true)
    const values:any = this.formPer.value
    let files = [...this.files()]
    // console.log('files', files);
    // console.log('values', values);
    try {
      if (this.personalId()) {
        let newFiles:any = await firstValueFrom( this.apiService.updatePersonal(this.personalId(), values))
        newFiles = newFiles.data
        
        // for (const key in newFiles) {
        //   console.log(key,values[key], Number.isInteger(values[key]), Number(values[key]), values.hasOwnProperty(key));
        //   this.formPer.get(key)?.setValue(Number(newFiles[key]))
        //   let index:number = files.findIndex(obj =>{obj.control == key})
        //   files[index].save = true
        //   files[index].fieldname = newFiles[key]
        //   console.log('EDITE');
        //   console.log(files[index].save, files[index].fieldname);
          
        // }
        
      }else{
        await firstValueFrom( this.apiService.addPersonal(values))
      }
      // this.formPer.markAsUntouched()
      // this.formPer.markAsPristine()
    } catch (e) {
      
    }
    // console.log('files', files);
    this.files.set(files)
    this.isLoading.set(false)
  }

  getOriginalName(control: string):string {
    let archivo = this.formPer.get(control)?.value;
    if (archivo) {
      const archivoFind = this.files().find((item) => item.fieldname == archivo)
      if (archivoFind) return archivoFind.originalname
      return archivo
    }
    return ''
  }

  async confirmDeleteArchivo( control: string) {
    try {
      let ArchivoIdForDelete = this.formPer.get(control)?.value;
      const archivo = this.files().find((item) => item.fieldname == ArchivoIdForDelete)
      if( archivo.save ){
        // console.log("Si se borro")
        const personalId = this.personalId()
        const tipo:any = tipoArchivo.find(obj => obj.label == control)
        await firstValueFrom( this.apiService.deleteArchivoPersonal(personalId, tipo.value))
      }else{
        // console.log("No se borro")
        this.notification.success('Respuesta', `Archivo borrado con exito `)
      }
      const newFiles = this.files().filter((item) => item.fieldname != ArchivoIdForDelete)
      this.files.set(newFiles)
      this.formPer.get(control)?.setValue('')
      this.formPer.markAsTouched()

    } catch (error) {
      
    }
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

}