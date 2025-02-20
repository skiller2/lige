import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef,  } from '@angular/core';
import { FormBuilder, FormArray } from '@angular/forms';
import { BehaviorSubject, firstValueFrom, debounceTime,switchMap } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { PersonalSearchComponent } from '../personal-search/personal-search.component';
import { FileUploadComponent } from "../../shared/file-upload/file-upload.component";
import { ClienteSearchComponent } from "../cliente-search/cliente-search.component";
import { ObjetivoSearchComponent } from "../objetivo-search/objetivo-search.component";

@Component({
  selector: 'app-tipo-documento-alta-drawer',
  templateUrl: './tipo-documento-alta-drawer.component.html',
  styleUrl: './tipo-documento-alta-drawer.component.less',
  standalone: true,
  imports: [SHARED_IMPORTS, ReactiveFormsModule, PersonalSearchComponent,
    CommonModule, FileUploadComponent, ClienteSearchComponent, ObjetivoSearchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class TipoDocumentoAltaDrawerComponent {
  tituloDrawer = signal<string>('Carga de Documento')
  visible = model<boolean>(false)
  refresh = model<number>(0)
  isLoading = signal(false);
  periodo = signal<any>({anio:0, mes:0})
  placement: NzDrawerPlacement = 'left';

  constructor(
    private searchService: SearchService,
    private apiService: ApiService,
  ) { }

  fb = inject(FormBuilder)
  formTipoDocumento = this.fb.group({
      tipoDocumentoId:'', denominacion:null, PersonalId:0, ClienteId:0, ObjetivoId:0,
      periodo:null, archivo:[],
  })

  $optionsTipos = this.searchService.getTiposDocumentoOptions();

  ngOnInit() {
    let now = new Date()
    this.periodo.set({anio:now.getFullYear(), mes:now.getMonth()+1})
  }

  async save() {
    this.isLoading.set(true)
    const values = this.formTipoDocumento.value
    console.log(values);
    
    try {
      await firstValueFrom(this.apiService.addTipoDocumento(values))
      let ref = this.refresh()
      this.refresh.set(++ref)
      this.formTipoDocumento.markAsUntouched()
      this.formTipoDocumento.markAsPristine()
    } catch (e) {
        
    }
    this.isLoading.set(false)
}
}
