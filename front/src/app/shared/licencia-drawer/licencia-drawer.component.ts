
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy,effect,EventEmitter, model,Input, Output, inject, viewChild } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { FormBuilder, FormGroup, NgForm, FormControl } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { EditorCategoriaComponent } from 'src/app/shared/editor-categoria/editor-categoria.component';



@Component({
  selector: 'app-licencia-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS,NzDescriptionsModule,ReactiveFormsModule,EditorCategoriaComponent],
  templateUrl: './licencia-drawer.component.html',
  styleUrl: './licencia-drawer.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class LicenciaDrawerComponent {

  //ngForm = viewChild.required(NgForm);
  placement: NzDrawerPlacement = 'left';
  visibleDrawer: boolean = false
  sucursalid = 0
  NombreApellidoId = 0
 

  @Output() onClose = new EventEmitter<boolean>();
  @Input() data = [];
  @Input() selectedPeriod = { year: 0, month: 0 };
  //private apiService = inject(ApiService)
  tituloDrawer = "Modificación de Licencia"
    
  @Input()
  set visible(value: boolean) {
    this.visibleDrawer = value;
    if (this.visibleDrawer)
      this.load()
  }

  formulario = new FormGroup({
    nombre: new FormControl({ value: '', disabled: true }),
    apellido: new FormControl({ value: '', disabled: true }),
    datePickerDesde: new FormControl(''),
    datePickerHasta: new FormControl(''),
    tipoLincencia: new FormControl(''),
    clase: new FormControl(''),
    categoria: new FormControl(''),
    horasMensuales: new FormControl(''),
    observacion: new FormControl(''),

  });
  async load() {

    setTimeout(async () => {
     
 
      this.formulario.patchValue({
        nombre: this.data[0]["PersonalNombre"],
        apellido: this.data[0]["PersonalApellido"],
        datePickerDesde: this.data[0]["PersonalLicenciaDesde"],
        datePickerHasta: this.data[0]["PersonalLicenciaHasta"],
        tipoLincencia: this.data[0]["TipoInasistenciaDescripcion"],
        clase: "",
        categoria: this.data[0]["CategoriaPersonalDescripcion"],
        horasMensuales: this.data[0]["PersonalLicenciaHorasMensuales"],
        observacion: this.data[0]["PersonalLicenciaObservacion"],
      });

      this.sucursalid = this.data[0]["SucursalId"]
      this.NombreApellidoId = this.data[0]["PersonalId"]
    }, 0);
    
     
  }

  get visible(): boolean {
    return this.visibleDrawer
  }
    
  closeDrawer(): void {
        this.visible = false
        this.onClose.emit(this.visibleDrawer)
        this.sucursalid = 0
        this.NombreApellidoId = 0
      }
}
