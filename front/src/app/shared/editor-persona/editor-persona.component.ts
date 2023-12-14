import { Component, ElementRef } from '@angular/core';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { PersonalSearchComponent } from '../personal-search/personal-search.component';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-editor-persona',
  templateUrl: './editor-persona.component.html',
  styleUrls: ['./editor-persona.component.less'],
  standalone: true,
  imports: [
    ...SHARED_IMPORTS,
    CommonModule,
    PersonalSearchComponent
  ],

})
export class EditorPersonaComponent {
  
  selectedId:number = 0; //Lo utiliza la grilla para pasar el valor
  selectedItem: any;
  collection?: any[]; // this will be filled by the collection of your column definition
  onItemChanged = new Subject<any>();    // object
  valueExtended!:any

  constructor(public element: ElementRef){}

  onChange(item: any) {
    if (item=='') item=0
    this.selectedId = item
    this.selectedItem = { id: item, fullName: this.valueExtended?.fullName } 
//    this.onItemChanged.next(item)
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
