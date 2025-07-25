import { ChangeDetectionStrategy, Component, inject, input,signal, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { FormBuilder } from '@angular/forms';
import { SearchService } from '../../../services/search.service';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-facturacion-form',
  imports: [  
    SHARED_IMPORTS,
    CommonModule,],
  templateUrl: './facturacion-form.html',
  styleUrl: './facturacion-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class FacturacionFormComponent {

  rowSelected = input<any>(null);
  rowSelectedSearch = signal<any>(null)
  private apiService = inject(ApiService)

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


  async ngOnInit(){

    let comprobanteNro =  Array.from(new Set(this.rowSelected().map((row: any) => row.ComprobanteNro))).join(', ')

    this.rowSelectedSearch.set( await firstValueFrom(this.apiService.getFacturas(comprobanteNro)))
    console.log("rowSelectedSearch...............", this.rowSelectedSearch())
 
    this.formCli.patchValue({
      ClienteFacturacionCUIT: this.rowSelected()[0].ClienteFacturacionCUIT,
      ClienteApellidoNombre: this.rowSelected()[0].ClienteApellidoNombre,
      ComprobanteNro: Array.from(new Set(this.rowSelectedSearch().map((row: any) => row.ComprobanteNro))).join(', '),
      ImporteTotal: this.rowSelectedSearch().reduce((acc: number, row: { ImporteTotal: any; }) => acc + (Number(row.ImporteTotal) || 0), 0),
      ComprobanteTipoCodigo: this.rowSelectedSearch()[0].ComprobanteTipoCodigo
    })
    this.formCli.get('ImporteTotal')?.disable()
    this.formCli.get('ComprobanteTipoCodigo')?.disable()
  }

  save(){
    console.log("save ", this.formCli.value)
  }
}
