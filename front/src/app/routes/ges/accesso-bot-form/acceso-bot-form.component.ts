import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef, effect, Injector, SimpleChanges,  } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { FormControl, NgForm } from '@angular/forms';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom, debounceTime,switchMap } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import  { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import {  DecodeHintType, MultiFormatReader, NotFoundException } from '@zxing/library';
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/browser';
import { HttpClient } from '@angular/common/http';

import { log } from '@delon/util';

@Component({
  selector: 'app-acceso-bot-form',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    CommonModule,PersonalSearchComponent,NzFlexModule,NzUploadModule,FileUploadComponent ],
  templateUrl: './acceso-bot-form.component.html',
  styleUrl: './acceso-bot-form.component.less'
})

export class AccesoBotFormComponent {
  ngForm = viewChild.required(NgForm);
  edit = model(true)
  addNew = model()
  isLoading = signal(false)
  PersonalId = model(0)
  private injector = inject(Injector)
  private apiService = inject(ApiService)
  codigo = signal(0)
  dniDisabled = signal(true)
  formChange$ = new BehaviorSubject('')
  private notification = inject(NzNotificationService)
  images = signal<{ src: string }[]>([])
  files = signal([])
  qrCodeResult = signal("")
  dniFresteDorso = signal(0)
  private readonly http = inject(HttpClient);

  async ngOnInit() {
    effect(async () => {
     
      if (this.edit()) {
        await this.load()
      } else{
        this.ngForm().form.reset()
      }
    }, { injector: this.injector,
         allowSignalWrites:true
    });

  }


  async decodeQrCodeFromUrl(url: string): Promise<void> {
    const reader = new BrowserMultiFormatReader();
    try {
      const img = await this.loadImage(url);
      const result = await reader.decodeFromImageElement(img);
      this.qrCodeResult.set(result.getText())
      //console.log('Contenido del QR:', this.qrCodeResult);
      this.dniFresteDorso.set(12)
    } catch (error) {
      this.dniFresteDorso.set(0)
    }
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // Esto es necesario para evitar problemas de CORS
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }

  async load() {

     this.ngForm().form.reset()
      if (this.PersonalId() > 0) {
       let vals = await firstValueFrom(this.apiService.getAccesoBot(this.PersonalId()));
        this.ngForm().form.patchValue(vals)
        this.ngForm().form.markAsUntouched()
        this.ngForm().form.markAsPristine()
      }
      return true
      { }
   }

  async updateImages() {

    this.images.set([])
    this.images.set([
      {
        src: await this.LoadArchivoPreview(this.PersonalId(), 12)
      },
      {
        src: await this.LoadArchivoPreview(this.PersonalId(), 13)
      }
    ]);
    
  }

  async LoadArchivoPreview(PersonalId: any, id:any){

      let url = "./assets/dummy-person-image.jpg"
      const res = await firstValueFrom(this.http.post('api/acceso-bot/filedni',  { PersonalId, id },  { responseType: 'blob' } ))
      if(res)
       url = URL.createObjectURL(res)
      return url

  }

  async save() {

    this.isLoading.set(true)
    let vals = this.ngForm().value
    let result
    let newFileArray: any[] = [];
    let createNotification = false
    try {

      // evaluacion de imagenes
      newFileArray = [];

      if(vals.files?.length > 1 && vals.files?.length < 3){
        for (const value of vals.files) {
          //var imageNewDni = await this.triggerFunction(value.fieldname,value.mimetype)
          let imageNewDni = `api/acceso-bot/downloadImagenDni/${value.filename}`
          await this.decodeQrCodeFromUrl(imageNewDni)
          value.esFrenteODorso = this.dniFresteDorso()
          newFileArray.push({ ...value })
          
        }

        const cantidadFrenteODorso = newFileArray.filter((file: { filename: string; esFrenteODorso?: number }) => file.esFrenteODorso === 12).length
        const existeFrenteODorso = cantidadFrenteODorso === 1

        if (!existeFrenteODorso) {
          //throw new Error('No se encontró un código QR en la imagen.')
          this.createNotification('error', 'No se encontró un código QR en la imagen..')
          createNotification = true
        }
        
      }else if(vals.files?.length ==  1){
        //throw new Error('Tiene que cargar los dos lados del DNI.')
        this.createNotification('error', 'Tiene que cargar los dos lados del DNI.')
        createNotification = true
        
      }

        //agregar o actualizar
      if(!createNotification){
        if (this.edit()) 
          result = await firstValueFrom(this.apiService.updateAccess(vals))
        else
          result = await firstValueFrom(this.apiService.addAccessBot(vals))

        await this.updateImages()
        this.ngForm().form.patchValue({
            telefono: result.data.telefono,
            codigo:result.data.codigo,
        })
      }
     

     this.ngForm().form.markAsUntouched()
     this.ngForm().form.markAsPristine()


    } catch (error:any) {
     
    }

     
    this.isLoading.set(false)
  } 

  async triggerFunction(fieldname: any,mimetype:any) {

    let src = await this.LoadArchivo(0, `${fieldname}.${mimetype.split("/")[1]}`)
    let blobUrl =  await URL.createObjectURL(src)
    return blobUrl
  }

  async LoadArchivo(documentId: any, filename:any){
    const res =  await firstValueFrom(this.http.post('api/file-upload/downloadFile',
      { 'documentId': documentId, filename: filename }, { responseType: 'blob' }
    ))
    return res
  }


  createNotification(type: string, message:any): void {
    this.notification.create(
      type,
      '',
      message
    );
  }

  async deleteAcceso() {
     await firstValueFrom(this.apiService.deleteAccess(this.PersonalId()))
  }

  async onPersonalIdChange(newPersonalId: any) {
    if(newPersonalId > 0){
      let vals = await firstValueFrom(this.apiService.getAccesoBotDNI(newPersonalId))
      // this.PersonalId.set(newPersonalId)
      this.PersonalId.set(newPersonalId)
      this.updateImages()
      if(this.edit())
        this.ngForm().form.patchValue({ PersonalDocumentoNro: vals.PersonalDocumentoNro,telefono:Number(vals.PersonalTelefonoNro)})
      else
        this.ngForm().form.patchValue({PersonalDocumentoNro: vals.PersonalDocumentoNro,telefono:Number(vals.PersonalTelefonoNro),nuevoCodigo:true })
      
    }
    
  }

}

