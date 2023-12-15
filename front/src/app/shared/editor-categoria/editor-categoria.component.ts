import { Component, ElementRef, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { SearchService } from 'src/app/services/search.service';

@Component({
  selector: 'app-categoria-persona',
  templateUrl: './editor-categoria.component.html',
  styleUrls: ['./editor-categoria.component.less'],
  standalone: true,
  imports: [
    ...SHARED_IMPORTS,
    CommonModule,
    //    PersonalSearchComponent
  ],

})
export class EditorCategoriaComponent {
  @ViewChild("eto") eto!: NzSelectComponent

  selectedId: number = 0; //Lo utiliza la grilla para pasar el valor
  selectedItem: any;
  collection?: any[]; // this will be filled by the collection of your column definition
  item?:any
  onItemChanged = new Subject<any>();    // object
  valueExtended!: any
  optionsArray: any 
  constructor(public element: ElementRef, private searchService:SearchService) { }

  onChange(item: any) {
    this.eto.focus()  //Al hacer click en el componente hace foco nuevamente
    const selopt: any = this.optionsArray.filter((v:any) => v.PersonalCategoriaCategoriaPersonalId == item)
    this.selectedId = item
    this.selectedItem = { id: item, fullName: selopt[0].CategoriaPersonalDescripcion }
    this.item.tipo = { id: selopt[0].TipoAsociadoId, fullName: selopt[0].TipoAsociadoDescripcion }
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
    const anio = 2023
    const mes = 11
    //    this.element.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
    //    this.eto.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
    if (this.item.apellidoNombre.id) { 
      this.searchService.getCategoriasPersona(
        Number(this.item.apellidoNombre.id),
        anio,
        mes
      ).subscribe((datos: any) => {
        this.optionsArray = datos.categorias
        if (this.selectedId==0)
          this.onChange(datos.categorias[0].PersonalCategoriaCategoriaPersonalId)
      })
    }
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
