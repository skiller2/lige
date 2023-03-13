import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'header-clear-storage',
  template: `
    <i nz-icon nzType="tool"></i>
    Limpiar almacenamiento local
  `,
  host: {
    '[class.d-block]': 'true'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderClearStorageComponent {
  constructor(private modalSrv: NzModalService, private messageSrv: NzMessageService) {}

  @HostListener('click')
  _click(): void {
    this.modalSrv.confirm({
      nzTitle: 'Está seguro que quiere limpiar los datos del navegador?',
      nzOnOk: () => {
        localStorage.clear();
        this.messageSrv.success('Limpieza finalizada!');
      }
    });
  }
}
