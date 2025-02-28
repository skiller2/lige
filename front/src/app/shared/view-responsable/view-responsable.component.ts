import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
    selector: 'app-view-responsable',
    imports: [...SHARED_IMPORTS, CommonModule],
    templateUrl: './view-responsable.component.html',
    styleUrl: './view-responsable.component.less',
    encapsulation: ViewEncapsulation.None
})
  
export class ViewResponsableComponent {
  @Input('list') list: any
  @Output() changeSize = new EventEmitter<any>();

  onChangeSize($event: any) {
    this.changeSize.emit($event)
  }
}

