import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, OnChanges, SimpleChanges, input } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { ObjetivosFormComponent } from "../objetivos-form/objetivos-form.component"
import { ObjetivoHistorialDrawerComponent } from '../../../shared/objetivo-historial-drawer/objetivo-historial-drawer.component'


@Component({
  selector: 'app-objetivos',
  standalone: true,
  templateUrl: './objetivos.component.html',
  styleUrl: './objetivos.component.less',
  encapsulation: ViewEncapsulation.None,
  providers: [AngularUtilService],
  imports: [
    SHARED_IMPORTS, 
    CommonModule, 
    PersonalSearchComponent, 
    ClienteSearchComponent,
    ObjetivosFormComponent,
    DetallePersonaComponent,
    FiltroBuilderComponent,
    ObjetivoHistorialDrawerComponent
    ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObjetivosComponent {

  public router = inject(Router);
  public route = inject(ActivatedRoute);

  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  gridDataInsert: any[] = [];
  detailViewRowCount = 1;
  editObjetivoId= signal(0)
  editClienteId = signal(0)
  ObjetivoNombre = signal("")
  editClienteElementoDependienteId = signal(0)
  edit =signal(false)
  addNew = false
  visibleHistorial = model<boolean>(false)
  childIsPristine = signal(true)
  excelExportService = new ExcelExportService()
  listObjetivos$ = new BehaviorSubject('')
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  
  formChange$ = new BehaviorSubject('');
  startFilters: any[]=[]

    private angularUtilService = inject(AngularUtilService)
    private searchService = inject(SearchService)
    private apiService = inject(ApiService)
    private settingService = inject(SettingsService)

    columns$ = this.apiService.getCols('/api/objetivos/cols')

    childAlta = viewChild.required<ObjetivosFormComponent>('objetivoFormAlta')
    childDeta = viewChild.required<ObjetivosFormComponent>('objetivoFormDeta')
    childEdit = viewChild.required<ObjetivosFormComponent>('objetivoFormEdit')

    gridData$ = this.listObjetivos$.pipe(
        debounceTime(500),
        switchMap(() => {
          return this.searchService.getListObjetivos({ options: this.listOptions })
            .pipe(map(data => {
              return data.list
            })
          )
        })
    )

    async ngOnInit(){

      this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)

      this.gridOptions.enableRowDetailView = this.apiService.isMobile()
      this.gridOptions.showFooterRow = true
      this.gridOptions.createFooterRow = true

      
  }

    async angularGridReady(angularGrid: any) {
      this.angularGrid = angularGrid.detail
      this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
           totalRecords(this.angularGrid)
           columnTotal('CantidadObjetivos', this.angularGrid)
      })
      if (this.apiService.isMobile())
          this.angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGrid.slickGrid.getDataItem(selrow)
    if (row?.id){
      this.editObjetivoId.set(row.ObjetivoId)
      this.editClienteId.set(row.ClienteId)
      this.editClienteElementoDependienteId.set(row.ClienteElementoDependienteId)
      //
      this.ObjetivoNombre.set(`${row.ClienteApellidoNombre} - ${row.Descripcion}`)
    }
    

  }

  // ngOnChanges(changes: SimpleChanges) {
  //   if (changes['addNew']) {
  //     this.listObjetivos$.next('');
  //   }
  // }

  getGridData(): void {
    this.listObjetivos$.next('')
    this.edit.set(false)
  }

  async handleAddOrUpdate(){
    this.listObjetivos$.next('')
  }

  onPristineChange(isPristine: boolean) {
    this.childIsPristine.set(isPristine)

  }

  listOptionsChange(options: any) {
      this.listOptions = options
      this.listObjetivos$.next('')
  }

  onTabsetChange(_event: any) {
    switch (_event.index) {
      case 3: //INSERT
       this.childAlta().newRecord()
        break
      case 2: //DETAIL
        this.childDeta().viewRecord(true)
        break;
      case 1: //EDIT
        this.childEdit().viewRecord(false)
        break;
        default:
        break;
    }

  }

  openDrawerforConsultHistory(): void{

    this.visibleHistorial.set(true)
       
  }

}
