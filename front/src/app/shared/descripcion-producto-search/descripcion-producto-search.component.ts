import { Component, ElementRef, ViewChild } from '@angular/core';
import { firstValueFrom, Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { ApiService } from 'src/app/services/api.service';
import { Injector, inject } from '@angular/core';
import { SearchService } from '../../services/search.service';

@Component({
    selector: 'app-descripcion-producto-search',
    templateUrl: './descripcion-producto-search.component.html',
    styleUrls: ['./descripcion-producto-search.component.less'],
    imports: [
        ...SHARED_IMPORTS,
        CommonModule,
        //    PersonalSearchComponent
    ]
})
export class DescripcionProductoSearchComponent {
  @ViewChild("eto") eto!: NzSelectComponent

  selectedId: any = ''; 
  selectedItem: any;
  collection?: any[]; 
  onItemChanged = new Subject<any>();    // object
  valueExtended!: any;
  optionsArray: any[] = [];
  
  
  public element = inject(ElementRef);
  public apiService = inject(ApiService);
  private searchService = inject(SearchService)

  onChange(item: any) {
    if(this.optionsArray.length > 0 ){
//      const selectedItem = this.optionsArray.find(option => option.TipoProductoId === item);
      this.eto?.focus()  //Al hacer click en el componente hace foco nuevamente
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
    this.optionsArray = await firstValueFrom(this.searchService.getTipoProducto())
  }

  ngOnDestroy() {

    this.eto.originElement.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this));
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.eto.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
      this.eto.focus()  //Al hacer click en el componente hace foco

    }, 1);
  }


}
