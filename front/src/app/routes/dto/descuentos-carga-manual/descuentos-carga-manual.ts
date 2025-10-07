import { Component, inject, input, OnInit,signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { SearchService } from 'src/app/services/search.service';
import { FormBuilder } from '@angular/forms';
import { DescuentosCargaManualTablePersonalComponent } from '../descuentos-carga-manual-table-personal/descuentos-carga-manual-table-personal';
import { DescuentosCargaManualTableObjetivoComponent } from '../descuentos-carga-manual-table-objetivo/descuentos-carga-manual-table-objetivo';

@Component({
  selector: 'app-descuentos-carga-manual',
  imports: [...SHARED_IMPORTS, CommonModule, DescuentosCargaManualTablePersonalComponent, DescuentosCargaManualTableObjetivoComponent],
  templateUrl: './descuentos-carga-manual.html',
  styleUrl: './descuentos-carga-manual.less'
})
export class DescuentosCargaManualComponent implements OnInit {

  private searchService = inject(SearchService)
  fb = inject(FormBuilder)

  $optionsTipo = this.searchService.getDecuentosTipoOptions();
  $optionsTable = this.searchService.getDescuentoTableOptions();
  anio = input<number>(0)
  mes = input<number>(0)

  formDescuentosCargaManual = this.fb.group({
    DescuentoId:0, tableName:'', files: [[]],
    tipocarga:''
})


  ptipocarga = signal<string |undefined>('')// Puede ser null; 0: PersonalOtroDescuento, 1: ObjetivoDescuento
  pDescuentoId = signal<number>(0)

  ngOnInit(): void {
   
  }

  // Función que se ejecuta cuando el select cambia
  onSelectChange(selectedValue: any): void {
    this.ptipocarga.set(this.formDescuentosCargaManual.get('tipocarga')?.value ?? undefined);
    this.formDescuentosCargaManual.patchValue({DescuentoId: 0 });
    this.pDescuentoId.set(0);
  }

  onSelectChangeDescuentoId(selectedValue: any): void {
    console.log('selectedValue',this.formDescuentosCargaManual.get('DescuentoId')?.value)
    this.pDescuentoId.set(this.formDescuentosCargaManual.get('DescuentoId')?.value ?? 0);
  }
}
