import { Component, input, model, signal, computed } from '@angular/core';

import { NzAffixModule } from 'ng-zorro-antd/affix';
import { SHARED_IMPORTS } from '@shared';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-auditoria-registro',
  imports: [...SHARED_IMPORTS, NzAffixModule],
  templateUrl: './auditoria-registro.html',
  styleUrl: './auditoria-registro.less'
})
export class AuditoriaRegistroComponent {
  visibleHistorialAuditoria = model<boolean>(false)
  aud_usuario_ins = input<string>('')
  aud_fecha_ins = input<string>('')
  aud_usuario_mod = input<string>('')
  aud_fecha_mod = input<string>('')
  placement: NzDrawerPlacement = 'left';

  private formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${hours}:${minutes}:${seconds} ${day}-${month}-${year}`;
  }

  tableData = computed(() => {
    const data = [];
    
    // Agregar registro de creacion
    if (this.aud_usuario_ins() && this.aud_fecha_ins()) {
      data.push({
        usuario: this.aud_usuario_ins(),
        fecha: this.formatDate(this.aud_fecha_ins()),
        accion: 'Creación'
      });
    }
    
    // Agregar registro de modificacin
    if (this.aud_usuario_mod() && this.aud_fecha_mod()) {
      data.push({
        usuario: this.aud_usuario_mod(),
        fecha: this.formatDate(this.aud_fecha_mod()),
        accion: 'Modificación'
      });
    }
    
    return data;
  });
}
