import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { Subject } from 'rxjs';
import { FiltroBuilderComponent } from '../filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from '../row-preload-detail/row-preload-detail.component';
import { SharedModule } from '../shared.module';

@Component({
  selector: 'app-editor-objetivo',
  templateUrl: './editor-objetivo.component.html',
  styleUrls: ['./editor-objetivo.component.less'],
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
export class EditorObjetivoComponent {
  selectedId = '';
  selectedItem: any;
  collection?: any[]; // this will be filled by the collection of your column definition
  onItemChanged = new Subject<any>();    // object
  valueExtended!:any

  onChange(item: any) {
    this.selectedItem = { id: item, fullName: this.valueExtended?.fullName } 
//    this.onItemChanged.next(this.selectedItem)
  }

  focus() {
    // do a focus
  }

}
