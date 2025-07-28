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
  comprobanteNroold = signal<string>("")

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
    ComprobanteTipoCodigo: "",
    comprobanteNroold: "",
    ClienteId: 0,
    ClienteElementoDependienteId: 0
  })


  async ngOnInit(){

    let clienteId = this.rowSelected()[0].ObjetivoCodigo.split('/')[0]
    let clienteElementoDependienteId = this.rowSelected()[0].ObjetivoCodigo.split('/')[1]
    this.rowSelectedSearch.set( await firstValueFrom(this.apiService.getFacturas(this.rowSelected()[0].ComprobanteNro, clienteId, clienteElementoDependienteId)))


    this.formCli.patchValue({
      comprobanteNroold: this.rowSelected()[0].ComprobanteNro,
      ClienteFacturacionCUIT: this.rowSelected()[0].ClienteFacturacionCUIT,
      ClienteApellidoNombre: this.rowSelected()[0].ClienteApellidoNombre,
      ComprobanteNro: this.rowSelected()[0].ComprobanteNro,
      ImporteTotal: this.rowSelectedSearch().reduce((acc: number, row: { ImporteTotal: any; }) => acc + (Number(row.ImporteTotal) || 0), 0),
      ComprobanteTipoCodigo: this.rowSelectedSearch()[0]?.ComprobanteTipoCodigo,
      ClienteId: clienteId,
      ClienteElementoDependienteId: clienteElementoDependienteId
    })
    this.formCli.get('ImporteTotal')?.disable()
    this.formCli.get('ClienteFacturacionCUIT')?.disable()
    this.formCli.get('ClienteApellidoNombre')?.disable()
    if(this.rowSelected()[0].ComprobanteNro != null){
      this.formCli.get('ComprobanteTipoCodigo')?.disable()
    }else{
      this.formCli.get('ComprobanteTipoCodigo')?.enable()
    }
  }

  async save(){
    console.log("save ", this.formCli.value)

    await firstValueFrom(this.apiService.saveFacturacion(this.formCli.value))
  }
}
