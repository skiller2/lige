import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef,  } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { FormControl, NgForm } from '@angular/forms';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom, debounceTime,switchMap } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { ReactiveFormsModule } from '@angular/forms';

import { SearchService } from '../../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TableHistorialLicenciaComponent } from '../table-historial-licencia/table-historial-licencia.component'
import { log } from '@delon/util';

export interface Option {
  label: string;
  value: string;
}

@Component({
    selector: 'app-licencia-historial-drawer',
    imports: [SHARED_IMPORTS, NzUploadModule, NzDescriptionsModule, ReactiveFormsModule, TableHistorialLicenciaComponent],
    templateUrl: './licencia-historial-drawer.component.html',
    styleUrl: './licencia-historial-drawer.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})



export class LicenciaHistorialDrawerComponent {
  PersonalId = input(0)
  PersonalNombre = model<string>("")

  visibleHistorial = model<boolean>(false)
  placement: NzDrawerPlacement = 'left';
}