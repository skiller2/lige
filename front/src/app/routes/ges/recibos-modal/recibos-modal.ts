import { Component, inject, model, signal, input, computed, effect } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { AngularUtilService } from 'angular-slickgrid';
import { CommonModule } from '@angular/common';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzModalModule } from "ng-zorro-antd/modal";
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { SearchService } from '../../../services/search.service';

@Component({
  selector: 'app-recibos-modal',
  templateUrl: './recibos-modal.html',
  styleUrl: './recibos-modal.scss',
  imports: [
    NzSelectModule,
    NzModalModule,
    CommonModule,
    SHARED_IMPORTS,
    NzAffixModule,
    NzUploadModule,
    ObjetivoSearchComponent,
    ClienteSearchComponent,
    PersonalSearchComponent,

  ],
  providers: [AngularUtilService]
})
export class RecibosModalComponent {

  selectedPeriod = { year: 0, month: 0 }
  isVisible = model(false)
  isWithDuplicado = false
  selectedOption = model("T")
  ObjetivoIdWithSearch = model(0)
  ClienteIdWithSearch = model(0)
  SucursalIdWithSearch = model(0)
  PersonalIdWithSearch = model(0)

  periodo = input<Date>(new Date())
  desde = signal<Date>(new Date())
  hasta = signal<Date>(new Date())
  anio = computed(() => this.desde()? this.desde()!.getFullYear(): 0 )
  mes = computed(() => this.desde()? this.desde()!.getMonth()+1 : 0)

  changePeriodo = effect(() => {
      this.desde.set(new Date(this.periodo()));
  })
  
  public searchService = inject(SearchService);

  $optionsSucursales = this.searchService.getSucursales();

  valHasta(){
    return this.selectedOption() != "P" ? null : this.hasta()
  }
}
