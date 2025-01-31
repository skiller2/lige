import { Component, ElementRef, input, model, signal, ViewChild } from '@angular/core';
import { firstValueFrom, Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { Injector, inject } from '@angular/core';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-select-search',
  templateUrl: './select-search.component.html',
  styleUrls: ['./select-search.component.less'],
  standalone: true,
  imports: [
    ...SHARED_IMPORTS,
    CommonModule,
    //    SelectSearchComponent
  ],

})
export class SelectSearchComponent {
  @ViewChild("sss") sss!: NzSelectComponent

  selectedId: any = ''  //Se usa externamente
  selectedItem: any = ''
  collection?: any[];
  //collection = input<any[]>([]) // this will be filled by the collection of your column definition
  
  selKey = signal('') 

  onItemChanged = new Subject<any>();    // object
 
  
  public element = inject(ElementRef);

  onChange(item: any) {
    if(this.collection!.length > 0 ){
//      const selectedItem = this.optionsArray.find(option => option.TipoProductoId === item);
      this.sss?.focus()  //Al hacer click en el componente hace foco nuevamente
      this.selectedId = item
      this.selectedItem = item
    }
  }

  focus() {

  }

  onKeydown(event: KeyboardEvent) {

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      event.stopImmediatePropagation()
    }
  }

  async ngOnInit() {
  }

  ngOnDestroy() {

    this.sss.originElement.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this));
  }

  ngAfterViewInit() {
    this.selKey.set(this.selectedItem)
    setTimeout(() => {
      this.sss.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
      this.sss.focus()  //Al hacer click en el componente hace foco

    }, 1);
  }


}
