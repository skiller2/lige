
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, OnChanges, SimpleChanges, input, ElementRef } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { I18nPipe } from '@delon/theme';

import { AdministradoresListadoTableComponent } from '../administradores-listado-table/administradores-listado-table';
import { AdministradoresClientesTableComponent } from '../administradores-clientes-table/administradores-clientes-table';

@Component({
  selector: 'app-administradores-listado',
  imports: [AdministradoresListadoTableComponent, AdministradoresClientesTableComponent, SHARED_IMPORTS],
  templateUrl: './administradores-listado.html',
  styleUrl: './administradores-listado.less'
})

export class AdministradoresListadoComponent {
  editAdministradorId = signal(0)
  childIsPristine = signal(true)

}
