import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef, effect, Injector,  } from '@angular/core';
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



import { log } from '@delon/util';

@Component({
  selector: 'app-acceso-bot-form',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    CommonModule,PersonalSearchComponent,NzFlexModule,NzUploadModule,FileUploadComponent],
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
  images =  signal<any[]>([])
  files = signal([])

  async ngOnInit() {

    effect(async () => {
      if (this.PersonalId()) {
        await this.load()
      }
    }, { injector: this.injector,
         allowSignalWrites:true
    });

  }

  qrCodeUrl = 'https://i.postimg.cc/L4YSs4p8/Screenshot-78.png';
  qrCodeResult: string | null = null;

  constructor() {
    this.decodeQrCodeFromUrl(this.qrCodeUrl);
  }

  async decodeQrCodeFromUrl(url: string): Promise<void> {
    const reader = new BrowserMultiFormatReader();
    try {
      const img = await this.loadImage(url);
      const result = await reader.decodeFromImageElement(img);
      this.qrCodeResult = result.getText();
      console.log('Contenido del QR:', this.qrCodeResult);
    } catch (error) {
      if (error instanceof NotFoundException) {
        console.error('No se encontró un código QR en la imagen.');
      } else {
        console.error('Error al leer el código QR:', error);
      }
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
        //this.codigo.set(vals.codigo.split("@")[0])
        this.ngForm().form.patchValue(vals)
        this.ngForm().form.markAsUntouched()
        this.ngForm().form.markAsPristine()
      }
      return true
      { }
   }


  async save() {

    this.isLoading.set(true)
    let vals = this.ngForm().value
    let result
    try {
         if (this.PersonalId()) {
          
         vals.Archivos = this.files
         //vals.PersonalId = this.PersonalId()
         result =  firstValueFrom(this.apiService.updateAccess(vals))

         }else{

           result = firstValueFrom(this.apiService.addAccessBot(vals))

         }
         this.ngForm().form.patchValue(result)
         this.ngForm().form.markAsUntouched()
         this.ngForm().form.markAsPristine()
      } catch (e) {
          
      }
      this.isLoading.set(false)
  }

  async deleteAcceso() {
     await firstValueFrom(this.apiService.deleteAccess(this.PersonalId()))
  }

  async onPersonalIdChange(newPersonalId: any) {
    if(newPersonalId > 0){
      let vals = await firstValueFrom(this.apiService.getAccesoBotDNI(newPersonalId))
      // this.PersonalId.set(newPersonalId)
      this.ngForm().form.patchValue({
        PersonalDocumentoNro: vals.PersonalDocumentoNro
      }
      )
    }
    
  }

}

