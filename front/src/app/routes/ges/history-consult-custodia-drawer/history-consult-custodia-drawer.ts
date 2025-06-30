import { Component, input, model, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { SHARED_IMPORTS } from '@shared';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-history-consult-custodia-drawer',
  imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule],
  templateUrl: './history-consult-custodia-drawer.html',
  styleUrl: './history-consult-custodia-drawer.less'
})
export class HistoryConsultCustodiaDrawerComponent {
  visibleHistorialCustodia = model<boolean>(false)
  aud_usuario_ins = input<string>('')
  aud_fecha_ins = input<string>('')
  aud_usuario_mod = input<string>('')
  aud_fecha_mod = input<string>('')
  placement: NzDrawerPlacement = 'left';

  tableData = computed(() => {
    const data = [];
    
    // Agregar registro de creacion
    if (this.aud_usuario_ins() && this.aud_fecha_ins()) {
      data.push({
        usuario: this.aud_usuario_ins(),
        fecha: this.aud_fecha_ins(),
        accion: 'Creación'
      });
    }
    
    // Agregar registro de modificacin
    if (this.aud_usuario_mod() && this.aud_fecha_mod()) {
      data.push({
        usuario: this.aud_usuario_mod(),
        fecha: this.aud_fecha_mod(),
        accion: 'Modificación'
      });
    }
    
    return data;
  });
}
