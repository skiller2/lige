import { Component, ElementRef, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { ApiService } from 'src/app/services/api.service';


@Component({
  selector: 'app-tipomovimiento-persona',
  templateUrl: './editor-tipomovimiento.component.html',
  styleUrls: ['./editor-tipomovimiento.component.less'],
  standalone: true,
  imports: [
    ...SHARED_IMPORTS,
    CommonModule,
    //    PersonalSearchComponent
  ],

})
export class EditorTipoMovimientoComponent {
  @ViewChild("eto") eto!: NzSelectComponent

  selectedId: any = ''; //Lo utiliza la grilla para pasar el valor
  selectedItem: any;
  collection?: any[]; // this will be filled by the collection of your column definition
  onItemChanged = new Subject<any>();    // object
  valueExtended!: any;
  optionsArray: any[] = [];
  // optionsArray = [{ MovimientoId: 21, Descripcion: 'Ajuste Positivo' }, { MovimientoId: 22, Descripcion: 'Ajuste Negativo' }]
  optionsArra2 = this.apiService.getTipoMovimiento("M")
  constructor(public element: ElementRef, public apiService: ApiService) { }

  onChange(item: any) {
    if(this.optionsArray.length > 0 ){
      const selectedItem = this.optionsArray.find(option => option.tipo_movimiento_id === item);
      this.eto?.focus()  //Al hacer click en el componente hace foco nuevamente
      const selopt: any = this.optionsArray
      this.selectedId = item
      this.selectedItem = { id: item, fullName: selectedItem.des_movimiento }
    }
  }

  focus() {
    // do a focus
  }

  onKeydown(event: KeyboardEvent) {
    //    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      event.stopImmediatePropagation()
    }
  }


  ngOnInit() {
    //    this.element.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
    //    this.eto.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));

    this.apiService.getTipoMovimiento("M").subscribe((data: any[]) => {
      this.optionsArray = data;
    });
    if (this.selectedId == '')
      this.onChange('N')
  }

  ngOnDestroy() {
    //    this.element.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this));
    this.eto.originElement.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this));
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.eto.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
      this.eto.focus()  //Al hacer click en el componente hace foco

    }, 1);
  }


}
