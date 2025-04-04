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
import { TableHistorialProductoComponent } from '../table-historial-producto/table-historial-producto.component'
import { log } from '@delon/util';

export interface Option {
  label: string;
  value: string;
}

@Component({
    selector: 'app-producto-historial-drawer',
    imports: [SHARED_IMPORTS, NzUploadModule, NzDescriptionsModule, ReactiveFormsModule, CommonModule, TableHistorialProductoComponent],
    templateUrl: './producto-historial-drawer.component.html',
    styleUrl: './producto-historial-drawer.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})



export class ProductoHistorialDrawerComponent {

  editProductoId = model()

  visibleHistorial = model<boolean>(false)
  placement: NzDrawerPlacement = 'left';
}