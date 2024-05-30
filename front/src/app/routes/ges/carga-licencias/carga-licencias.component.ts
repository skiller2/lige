import { Component,ViewChild} from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TableAbmLicenciaComponent } from '../../../shared/table-abm-licencia/table-abm-licencia.component'
import {
  BehaviorSubject,
} from 'rxjs';
import { NgForm } from '@angular/forms';
import { LicenciaDrawerComponent } from  '../../../shared/licencia-drawer/licencia-drawer.component'


@Component({
  selector: 'app-carga-licencias',
  standalone: true,
  imports: [SHARED_IMPORTS,CommonModule,TableAbmLicenciaComponent,LicenciaDrawerComponent],
  templateUrl: './carga-licencias.component.html',
  styleUrl: './carga-licencias.component.less'
})
export class CargaLicenciasComponent {
  @ViewChild('LicenciaForm', { static: true }) LicenciaForm: NgForm = new NgForm([], []);
  tabIndex = 0
  selectedPeriod = { year: 0, month: 0 };
  formChange$ = new BehaviorSubject('');
  visibleDrawer: boolean = false

  dateChange(result: Date): void {
    this.selectedPeriod.year = result.getFullYear();
    this.selectedPeriod.month = result.getMonth() + 1;

    localStorage.setItem('anio', String(this.selectedPeriod.year));
    localStorage.setItem('mes', String(this.selectedPeriod.month));

    this.formChange('');
  }
  

  ngAfterViewInit(): void {
    const now = new Date(); //date
    setTimeout(() => {
      const anio =
        Number(localStorage.getItem('anio')) > 0
          ? Number(localStorage.getItem('anio'))
          : now.getFullYear();
      const mes =
        Number(localStorage.getItem('mes')) > 0
          ? Number(localStorage.getItem('mes'))
          : now.getMonth() + 1;

      this.LicenciaForm.form.get('periodo')?.setValue(new Date(anio, mes - 1, 1));
    }, 1);
  }

  formChange(event: any) {
    this.formChange$.next(event);
  }

  openDrawer(): void {
     
    //if (this.userId == 0) return
    this.visibleDrawer = true
}

  closeDrawer(): void {
    this.visibleDrawer = false;
}

}
