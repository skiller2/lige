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

import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadChangeParam } from 'ng-zorro-antd/upload';

import { log } from '@delon/util';

@Component({
  selector: 'app-acceso-bot-form',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    CommonModule,PersonalSearchComponent,NzFlexModule,NzUploadModule],
  templateUrl: './acceso-bot-form.component.html',
  styleUrl: './acceso-bot-form.component.less'
})

export class AccesoBotFormComponent {
  ngForm = viewChild.required(NgForm);
  edit = model(true)
  isLoading = signal(false)
  addNew = model()
  checked = true
  PersonalId = model(0)
  private injector = inject(Injector)
  private apiService = inject(ApiService)
  codigo = signal(0)
  dniDisabled = signal(true)
  formChange$ = new BehaviorSubject('');


  async ngOnInit() {

    effect(async () => {
      if (this.PersonalId()) {
        await this.load()
      }
    }, { injector: this.injector });

  }

  async load() {
    console.log("load")
     this.ngForm().form.reset()

      if (this.PersonalId() > 0) {
        let vals = await firstValueFrom(this.apiService.getAccesoBot(this.PersonalId()));
        console.log("vals ", vals)
        this.codigo.set(vals.codigo.split("@")[0])
        this.ngForm().form.patchValue(vals)
        this.ngForm().form.markAsUntouched()
        this.ngForm().form.markAsPristine()

      }

      return true
      { }
   }


  async save() {
    // this.isLoading.set(true)
    // let form = this.formCli.value
    try {
        // if (this.ClienteId()) {
        //   let result = await firstValueFrom(this.apiService.updateCliente(form, this.ClienteId()))

        //   this.formCli.patchValue({
        //     infoClienteContacto: result.data.infoClienteContacto,
        //     infoDomicilio:result.data.infoDomicilio,
        //   });

        // } else {
        //   //este es para cuando es un nuevo registro
        //   let result =  await firstValueFrom(this.apiService.addCliente(form))

        //   this.formCli.patchValue({
        //     id:result.data.ClienteNewId,
        //     infoClienteContacto: result.data.infoClienteContacto,
        //     infoDomicilio:result.data.infoDomicilio,
        //   });

        //   this.ClienteId.set(result.data.ClienteNewId)

         
        // }
        
        // this.formCli.markAsUntouched()
        // this.formCli.markAsPristine()
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
      this.ngForm().form.patchValue({
        PersonalDocumentoNro: vals.PersonalDocumentoNro
      }
      )
    }
    
  }

  constructor(private msg: NzMessageService) {}

  handleChange(info: NzUploadChangeParam): void {
    if (info.file.status !== 'uploading') {
      console.log(info.file, info.fileList);
    }
    if (info.file.status === 'done') {
      this.msg.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      this.msg.error(`${info.file.name} file upload failed.`);
    }
  }

}

