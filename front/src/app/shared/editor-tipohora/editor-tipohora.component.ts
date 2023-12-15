import { Component, ElementRef, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { X } from 'dist/chunk-RPA3BUAA';

@Component({
  selector: 'app-tipohora-persona',
  templateUrl: './editor-tipohora.component.html',
  styleUrls: ['./editor-tipohora.component.less'],
  standalone: true,
  imports: [
    ...SHARED_IMPORTS,
    CommonModule,
    //    PersonalSearchComponent
  ],

})
export class EditorTipoHoraComponent {
  @ViewChild("eto") eto!: NzSelectComponent

  selectedId: string = ''; //Lo utiliza la grilla para pasar el valor
  selectedItem: any;
  collection?: any[]; // this will be filled by the collection of your column definition
  onItemChanged = new Subject<any>();    // object
  valueExtended!: any
  optionsArray = [{ TipoHoraId: 'N', Descripcion: 'Normal' }, { TipoHoraId: 'C', Descripcion: 'Capacitación' }]
  constructor(public element: ElementRef) { }

  onChange(item: any) {
    this.eto?.focus()  //Al hacer click en el componente hace foco nuevamente
    const selopt: any = this.optionsArray.filter((v) => v.TipoHoraId == item)
    this.selectedId =item
    this.selectedItem = { id: item, fullName: selopt[0].Descripcion }
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
