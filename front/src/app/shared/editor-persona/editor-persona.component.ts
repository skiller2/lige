import { Component, ElementRef } from '@angular/core';
import { Subject } from 'rxjs';
import { SharedModule } from '../shared.module';
import { CommonModule } from '@angular/common';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FiltroBuilderComponent } from '../filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from '../row-preload-detail/row-preload-detail.component';

@Component({
  selector: 'app-editor-persona',
  templateUrl: './editor-persona.component.html',
  styleUrls: ['./editor-persona.component.less'],
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    NzAffixModule,
    FiltroBuilderComponent,
    RowPreloadDetailComponent,
    RowDetailViewComponent,
  ],

})
export class EditorPersonaComponent {
  selectedId = '';
  selectedItem: any;
  collection?: any[]; // this will be filled by the collection of your column definition
  onItemChanged = new Subject<any>();    // object
  valueExtended!:any

  constructor(public element: ElementRef){}


  onChange(item: any) {
    this.selectedItem = { id: item, fullName: this.valueExtended?.fullName } 
//    this.onItemChanged.next(this.selectedItem)
  }

  focus() {
    // do a focus
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      event.stopImmediatePropagation()
    }
  }


  ngOnInit() {
    this.element.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
  }

  ngOnDestroy() {
    this.element.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this));
  }


}
