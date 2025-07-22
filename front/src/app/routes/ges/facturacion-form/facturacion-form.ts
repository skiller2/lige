import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { FormBuilder } from '@angular/forms';
@Component({
  selector: 'app-facturacion-form',
  imports: [  
    SHARED_IMPORTS,
    CommonModule,],
  templateUrl: './facturacion-form.html',
  styleUrl: './facturacion-form.less'
})
export class FacturacionFormComponent {
  
  fb = inject(FormBuilder)
  formCli = this.fb.group({
    ClienteFacturacionCUIT: 0,
    ClienteDenominacion: "",
  
  })
}
