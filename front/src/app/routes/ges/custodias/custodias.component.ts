import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
// import { Observable } from 'rxjs';
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
import { CustodiaFormComponent } from "../custodias-form/custodias-form.component";
import { SettingsService } from '@delon/theme';

@Component({
    selector: 'app-custodias',
    templateUrl: './custodias.component.html',
    styleUrls: ['./custodias.component.less'],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule, PersonalSearchComponent, ClienteSearchComponent, DetallePersonaComponent, FiltroBuilderComponent, CustodiaFormComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,

})
export class CustodiaComponent {
    public router = inject(Router);
    public route = inject(ActivatedRoute);

    angularGrid!: AngularGridInstance;
    gridOptions!: GridOption;
    gridDataInsert: any[] = [];
    detailViewRowCount = 1;
    editCustodiaId = 0;
    estado : boolean = true
    edit : boolean = false
    excelExportService = new ExcelExportService()
    listCustodia$ = new BehaviorSubject('')
    listOptions: listOptionsT = {
        filtros: [],
        sort: null,
    };
    startFilters: { field: string; condition: string; operator: string; value: string; }[]=[]

    private angularUtilService = inject(AngularUtilService)
    private searchService = inject(SearchService)
    private apiService = inject(ApiService)
    private settingService = inject(SettingsService)

    columns$ = this.apiService.getColumnsCustodia().pipe(map((cols) => {
        let mapped = cols.map((col:any) => {
            let item = col
            if(col.type)
                item = {...item, type : FieldType[col.type as keyof typeof FieldType]}
            if(col.formatter = 'complexObject')
                item = {...item, formatter: Formatters.complexObject}
            return item
        });
        return mapped
    }));

    gridData$ = this.listCustodia$.pipe(
        debounceTime(500),
        switchMap(() => {
          return this.searchService.getListaObjetivoCustodia({ options: this.listOptions })
            .pipe(map(data => { return data }))
        })
      )

    async ngOnInit(){
        const user: any = this.settingService.getUser()
        if (user.PersonalId && !user.GrupoActividad.find((elem:any) => {elem == "Administracion"}) && !user.GrupoActividad.find((elem:any) => {elem == "Liquidaciones"})) {
            this.startFilters = [
                { field:'responsable', condition: 'AND', operator: '=', value: user.PersonalId.toString()},
            ]
        }
        this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptions.enableRowDetailView = false
        this.gridOptions.editable = false
        this.gridOptions.autoEdit = true
        this.gridOptions.enableAutoSizeColumns = true
        this.gridOptions.fullWidthRows = true
        this.gridOptions.enableExcelExport = false
    }

    ngAfterViewInit(): void {
    }

    async angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid.detail

        if (this.apiService.isMobile())
            this.angularGrid.gridService.hideColumnByIds([])
    }

    handleSelectedRowsChanged(e: any): void {
        const selrow = e.detail.args.rows[0]
        const row = this.angularGrid.slickGrid.getDataItem(selrow)
        this.editCustodiaId = row.id

        if (row.estado.tipo === 4){
            this.estado = false
        }else{
            this.estado = true
        }
    }

    getGridData(): void {
        this.listCustodia$.next('');
    }

    listOptionsChange(options: any) {
        this.listOptions = options;
        this.listCustodia$.next('');
    }

    setEdit(value: boolean): void {
        this.edit = value
    }
}