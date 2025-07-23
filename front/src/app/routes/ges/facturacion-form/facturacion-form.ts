import { Component, inject, input,signal, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { FormBuilder } from '@angular/forms';
import { SearchService } from '../../../services/search.service';

@Component({
  selector: 'app-facturacion-form',
  imports: [  
    SHARED_IMPORTS,
    CommonModule,],
  templateUrl: './facturacion-form.html',
  styleUrl: './facturacion-form.less'
})
export class FacturacionFormComponent {

  rowSelected = input<any>(null);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rowSelected'] && this.rowSelected()) {
      this.ngOnInit();
    }
  }

  private searchService = inject(SearchService)
  $optionsComprobanteTipo = this.searchService.getComprobanteTipoSearch();

  fb = inject(FormBuilder)
  formCli = this.fb.group({
    ClienteFacturacionCUIT: 0,
    ClienteApellidoNombre: "",
    ComprobanteNro: "",
    ImporteTotal: 0,
    ComprobanteTipoCodigo: ""
  })
  ngOnInit(){
    this.formCli.patchValue({
      ClienteFacturacionCUIT: this.rowSelected()[0].ClienteFacturacionCUIT,
      ClienteApellidoNombre: this.rowSelected()[0].ClienteApellidoNombre,
      ComprobanteNro: this.rowSelected()[0].ComprobanteNro,
      ImporteTotal: this.rowSelected().reduce((acc: number, row: { ImporteTotal: any; }) => acc + (Number(row.ImporteTotal) || 0), 0)

    })
    this.formCli.get('ImporteTotal')?.disable()
  }

  save(){
    console.log("save ", this.formCli.value)
  }
}
