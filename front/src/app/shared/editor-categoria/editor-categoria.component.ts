import { Component, ElementRef, ViewChild } from '@angular/core';
import { Subject, firstValueFrom } from 'rxjs';
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
  item?: any
  params?:any
  onItemChanged = new Subject<any>();    // object
  valueExtended!: any
  optionsArray: any 
  constructor(public element: ElementRef, private searchService:SearchService) { }

  onChange(key: any) {
    this.eto.focus()  //Al hacer click en el componente hace foco nuevamente
    const selopt: any = this.optionsArray.filter((v:any) => v.id == key)
    this.selectedId = key
    if (selopt[0])
      this.selectedItem = { id: key, fullName: `${selopt[0]?.CategoriaPersonalDescripcion.trim()} ${(selopt[0]?.ValorLiquidacionHorasTrabajoHoraNormal > 0) ? selopt[0].ValorLiquidacionHorasTrabajoHoraNormal : ''}`, tipoId: selopt[0]?.TipoAsociadoId, tipoFullname: selopt[0]?.TipoAsociadoDescripcion, horasRecomendadas:selopt[0]?.ValorLiquidacionHorasTrabajoHoraNormal, categoriaId:selopt[0]?.PersonalCategoriaCategoriaPersonalId }
    else
      this.selectedItem = { id: null, fullName: '', tipoId: null, categoriaId: null,tipoFullName: '', horasRecomendadas: 0 }
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


  async ngOnInit() {
    //    this.element.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
    //    this.eto.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
    if (this.item.apellidoNombre.id) { 
      const categorias = await firstValueFrom(this.searchService.getCategoriasPersona(Number(this.item.apellidoNombre.id), this.params?.anio, this.params?.mes, this.params?.SucursalId))
      
      this.optionsArray = (this.params?.SucursalId > 0) ? categorias.categorias?.filter((f:any)=>f.ValorLiquidacionHoraNormal >0) : categorias.categorias
      if (this.selectedId==0 && this.optionsArray.length>0)
        this.onChange(this.optionsArray[0].id)
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
