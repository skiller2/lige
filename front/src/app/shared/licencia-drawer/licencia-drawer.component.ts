
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';


@Component({
  selector: 'app-licencia-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './licencia-drawer.component.html',
  styleUrl: './licencia-drawer.component.less'
})

export class LicenciaDrawerComponent {

  //visible = false;
  placement: NzDrawerPlacement = 'left';
  visibleDrawer: boolean = false


  @Output() onClose = new EventEmitter<boolean>();

    
  @Input()
  set visible(value: boolean) {
    this.visibleDrawer = value;
    if (this.visibleDrawer)
      this.load()
  }

  load(): void {
   
  }

  get visible(): boolean {
    return this.visibleDrawer
  }


  ngOnInit(): void {
    //    this.load()
      }
    
  closeDrawer(): void {
        this.visible = false
        this.onClose.emit(this.visibleDrawer)
      }
}
