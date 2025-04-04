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
import { SearchService } from '../../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TableHistorialContratoComponent } from '../table-historial-contrato/table-historial-contrato.component'
import { log } from '@delon/util';

export interface Option {
  label: string;
  value: string;
}

@Component({
    selector: 'app-objetivo-historial-drawer',
    imports: [SHARED_IMPORTS, NzUploadModule, NzDescriptionsModule, ReactiveFormsModule, CommonModule, TableHistorialContratoComponent],
    templateUrl: './objetivo-historial-drawer.component.html',
    styleUrl: './objetivo-historial-drawer.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})



export class ObjetivoHistorialDrawerComponent {
  ObjetivoId = input(0)
  ClienteId = input(0)
  ClienteElementoDependienteId = input(0)
  ObjetivoNombre = input<string>("")

  visibleHistorial = model<boolean>(false)
  placement: NzDrawerPlacement = 'left';
}