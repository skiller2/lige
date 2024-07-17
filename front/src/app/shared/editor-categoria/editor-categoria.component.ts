import { Component, ElementRef, Input, SimpleChanges, ViewChild, computed, forwardRef, input, model } from '@angular/core';
import { Subject, firstValueFrom, noop } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { SearchService } from 'src/app/services/search.service';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms'

@Component({
  selector: 'app-categoria-persona',
  templateUrl: './editor-categoria.component.html',
  styleUrls: ['./editor-categoria.component.less'],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditorCategoriaComponent),
      multi: true,
    },
  ],
  imports: [
    ...SHARED_IMPORTS,
    CommonModule,
    //    PersonalSearchComponent
  ],

})
export class EditorCategoriaComponent {
  @ViewChild("eto") eto!: NzSelectComponent

  selectedId: string = ''; //Lo utiliza la grilla para pasar el valor
  selectedItem: any;//Lo utiliza la grilla
  collection?: any[]; // this will be filled by the collection of your column definition
  item?: any //Lo utiliza la grilla
  params?: any //Lo utiliza la grilla

  onItemChanged = new Subject<any>();    // object
  valueExtended!: any
  optionsArray: any[] = [];
  constructor(public element: ElementRef, private searchService: SearchService) { }

  selectedPeriod = model({ year: 0, month: 0 });
  sucursalid = model(0)
  PersonalId = model(0)
  disabled = model<boolean>(false)

  onChange(key: any) {
    
    this.eto.focus()  //Al hacer click en el componente hace foco nuevamente

    this.selectedId = key;
    this.internalRefresh()

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sucursalid'] || changes['selectedPeriod'] || changes['PersonalId']) {
      this.optionsArray = []
      this.internalRefresh();
    }
  }

  async internalRefresh() {
    if (this.PersonalId() && this.optionsArray.length == 0) {
      const categorias = await firstValueFrom(this.searchService.getCategoriasPersona(this.PersonalId(), this.selectedPeriod().year, this.selectedPeriod().month, this.sucursalid()))
      this.optionsArray = (this.params?.SucursalId > 0) ? categorias.categorias?.filter((f: any) => f.ValorLiquidacionHoraNormal > 0) : categorias.categorias
    }
    let selopt = this.optionsArray.filter((f: any) => f.id == this.selectedId)
    let propagate = { id: '', fullName: '', tipoId: null, categoriaId: null, tipoFullName: '', horasRecomendadas: 0 }

    if (selopt[0]) {
      propagate = { id: this.selectedId, fullName: `${selopt[0]?.CategoriaPersonalDescripcion.trim()} ${(selopt[0]?.ValorLiquidacionHorasTrabajoHoraNormal > 0) ? selopt[0].ValorLiquidacionHorasTrabajoHoraNormal : ''}`, tipoId: selopt[0]?.TipoAsociadoId, tipoFullName: selopt[0].TipoAsociadoDescripcion, horasRecomendadas: selopt[0]?.ValorLiquidacionHorasTrabajoHoraNormal, categoriaId: selopt[0]?.PersonalCategoriaCategoriaPersonalId }
    } else if (this.optionsArray[0]) {
      this.selectedId = this.optionsArray[0].id
      propagate = { id: this.selectedId, fullName: `${this.optionsArray[0]?.CategoriaPersonalDescripcion.trim()} ${(this.optionsArray[0]?.ValorLiquidacionHorasTrabajoHoraNormal > 0) ? this.optionsArray[0].ValorLiquidacionHorasTrabajoHoraNormal : ''}`, tipoId: this.optionsArray[0]?.TipoAsociadoId, tipoFullName: this.optionsArray[0]?.TipoAsociadoDescripcion, horasRecomendadas: this.optionsArray[0]?.ValorLiquidacionHorasTrabajoHoraNormal, categoriaId: this.optionsArray[0]?.PersonalCategoriaCategoriaPersonalId }
    }

    
    if (this.selectedItem!=propagate)
    this.propagateChange(propagate)

    this.selectedItem = propagate

  }

  async ngOnInit() {
    if (this.params?.anio && this.params?.mes)
      this.selectedPeriod.set({ year: this.params?.anio, month: this.params?.mes })
    if (this.params?.SucursalId)
      this.sucursalid.set(this.params?.SucursalId)
    if (this.item?.apellidoNombre.id)
      this.PersonalId.set(this.item?.apellidoNombre.id)
    this.internalRefresh()

    this.element.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));

  }

  ngOnDestroy() {
    //    this.element.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this));
    this.eto.originElement.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this));
  }

  async ngAfterViewInit() {

    setTimeout(() => {

      this.eto.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
      this.eto.focus()  //Al hacer click en el componente hace foco

    }, 1);
  }


  private propagateTouched: () => void = noop
  private propagateChange: (_: any) => void = noop

  registerOnChange(fn: any) {

    this.propagateChange = fn
  }

  registerOnTouched(fn: any) {
    this.propagateTouched = fn
  }

  writeValue(value: any) {
    const tmp = (value?.id)?value.id:value
    if (tmp !== this.selectedId) {
      this.selectedId = tmp
      this.internalRefresh()
    }
  }


}
