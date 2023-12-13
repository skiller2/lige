import { CommonModule } from '@angular/common';
import { Component, ElementRef } from '@angular/core';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { Subject } from 'rxjs';
import { FiltroBuilderComponent } from '../filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from '../row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from '../row-preload-detail/row-preload-detail.component';
import { SHARED_IMPORTS } from '@shared';
import { ObjetivoSearchComponent } from '../objetivo-search/objetivo-search.component';


@Component({
  selector: 'app-editor-objetivo',
  templateUrl: './editor-objetivo.component.html',
  styleUrls: ['./editor-objetivo.component.less'],
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule, ObjetivoSearchComponent,],

})
export class EditorObjetivoComponent {
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
    console.log('focus')
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      event.stopImmediatePropagation()
    }
  }


  ngOnInit() {
    
    this.element.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
    setTimeout(() => {
      this.element.nativeElement.focus()
    }, 4000);

  }

  ngOnDestroy() {
    
    this.element.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this));

  }
}
