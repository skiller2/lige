import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef,  } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { FormControl, NgForm } from '@angular/forms';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom, debounceTime,switchMap } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TableHistorialLicenciaComponent } from '../../shared/table-historial-licencia/table-historial-licencia.component'
import { log } from '@delon/util';

export interface Option {
  label: string;
  value: string;
}

@Component({
  selector: 'app-licencia-historial-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS,NzUploadModule, NzDescriptionsModule, ReactiveFormsModule, CommonModule,TableHistorialLicenciaComponent],
  templateUrl: './licencia-historial-drawer.component.html',
  styleUrl: './licencia-historial-drawer.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})



export class LicenciaHistorialDrawerComponent {

  PersonalId = input.required<number>()
  PersonalLicenciaId = input.required<number>()
  RefreshLicencia =  model<boolean>(false)
  visibleHistorial = model<boolean>(false)
  selectedPeriod = input.required<any>()
  tituloDrawer = input.required<string>()
  PersonalNombre = input.required<string>()

  ngForm = viewChild.required(NgForm);
  openDrawerForConsult =  input<boolean>(false)
  private apiService = inject(ApiService)
  formChange$ = new BehaviorSubject('');
  private notification = inject(NzNotificationService);
  options: any[] = [];
  isSaving= model<boolean>(false)
  placement: NzDrawerPlacement = 'left';
  uploading$ = new BehaviorSubject({loading:false,event:null});
  uploadFileModel = viewChild.required(NgForm);
  constructor(
    private searchService: SearchService
  ) { }

  async ngOnInit(): Promise<void> {

    //this.ArchivosLicenciasAdd = []
    //this.options = await firstValueFrom(this.apiService.getOptionsForLicenciaDrawer())
  }
  
}