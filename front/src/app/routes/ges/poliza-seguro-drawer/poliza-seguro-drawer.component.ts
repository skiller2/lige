import { Component, computed, inject, model } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-poliza-seguro-drawer',
  imports: [SHARED_IMPORTS, NzUploadModule, NzDescriptionsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './poliza-seguro-drawer.component.html',
  styleUrl: './poliza-seguro-drawer.component.less'
})
export class PolizaSeguroDrawerComponent {

  visible = model<boolean>(false)
  placement: NzDrawerPlacement = 'left';
  tituloDrawer = computed(() => this.visible() ? 'Editar Poliza Seguro' : 'Nueva Poliza Seguro')

  



  fb = inject(FormBuilder)
  formCli = this.fb.group({
    PersonalEstudioId: 0,
    PersonalId: 0,
    TipoEstudioId: 0,
    PersonalEstudioTitulo: "",
    CursoHabilitacionId: 0,
    PersonalEstudioOtorgado: "",
    PersonalIdForEdit: 0,
    files: [],
    PersonalEstudioPagina1Id: 0
  })


}
