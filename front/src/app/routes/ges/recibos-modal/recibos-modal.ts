import { Component, ViewChild, Injector, inject, TemplateRef, ChangeDetectorRef, model, signal, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { AngularUtilService } from 'angular-slickgrid';
import { CommonModule } from '@angular/common';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzModalModule } from "ng-zorro-antd/modal";
import { ObjetivoSearchComponent } from 'src/app/shared/objetivo-search/objetivo-search.component';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ClienteSearchComponent } from 'src/app/shared/cliente-search/cliente-search.component';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';
import { SearchService } from 'src/app/services/search.service';

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

  mes = input(0)
  anio = input(0)


  public searchService = inject(SearchService);

  $optionsSucursales = this.searchService.getSucursales();

}
