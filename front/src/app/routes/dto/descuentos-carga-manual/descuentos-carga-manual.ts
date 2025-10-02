import { Component, inject, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { SearchService } from 'src/app/services/search.service';
import { FormBuilder } from '@angular/forms';
import { DescuentosCargaManualTablePersonalComponent } from '../descuentos-carga-manual-table-personal/descuentos-carga-manual-table-personal';

@Component({
  selector: 'app-descuentos-carga-manual',
  imports: [...SHARED_IMPORTS, CommonModule, DescuentosCargaManualTablePersonalComponent],
  templateUrl: './descuentos-carga-manual.html',
  styleUrl: './descuentos-carga-manual.less'
})
export class DescuentosCargaManualComponent implements OnInit {

  private searchService = inject(SearchService)
  fb = inject(FormBuilder)

  $optionsTipo = this.searchService.getDecuentosTipoOptions();
  $optionsTable = this.searchService.getDescuentoTableOptions();


  formDescuentosCargaManual = this.fb.group({
    DescuentoId:0, tableName:'', files: [[]]
})


  ngOnInit(): void {
   
  }
}
