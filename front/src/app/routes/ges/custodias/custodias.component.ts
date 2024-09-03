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
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { FormBuilder } from '@angular/forms';

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
    rows: number[] = [];
    detailViewRowCount = 1;
    editCustodiaId = model(0);
    estado = signal(true);
    edit = signal(false);
    visible = signal(false);
    isLoading = signal(false);
    excelExportService = new ExcelExportService();
    listCustodia$ = new BehaviorSubject('');
    listOptions: listOptionsT = {
        filtros: [],
        sort: null,
    };
    startFilters: { field: string; condition: string; operator: string; value: string; forced:boolean}[]=[]

    private angularUtilService = inject(AngularUtilService)
    private searchService = inject(SearchService)
    private apiService = inject(ApiService)
    private settingService = inject(SettingsService)

    columns$ = this.apiService.getCols('/api/custodia/cols')
    $optionsEstadoCust = this.searchService.getEstadoCustodia();

    gridData$ = this.listCustodia$.pipe(
        debounceTime(500),
        switchMap(() => {
          return this.searchService.getListaObjetivoCustodia({ options: this.listOptions })
            .pipe(map(data => { return data }))
        })
    )

    fb = inject(FormBuilder)
    formCusEstado = this.fb.group({ estado: 0, numFactura: 0 })
    numFactura(): boolean {
        const value = this.formCusEstado.get("estado")?.value
        if(value == 3 || value == 4)
            return true
        else
        return false
    }

    async ngOnInit(){
        // const user: any = this.settingService.getUser()
        // console.log('user.GrupoActividad',user)
        // if (user.PersonalId && !user.GrupoActividad.find((elem:any) => {elem == "Administracion"}) && !user.GrupoActividad.find((elem:any) => {elem == "Liquidaciones"})) {
        //     this.startFilters = [
        //         { field:'responsable', condition: 'AND', operator: '=', value: user.PersonalId.toString(), forced:true},
        //     ]
        // }
        this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptions.enableRowDetailView = false
        this.gridOptions.editable = false
        this.gridOptions.autoEdit = true
        this.gridOptions.enableAutoSizeColumns = true
        // this.gridOptions.fullWidthRows = true
        this.gridOptions.enableExcelExport = false
        this.gridOptions.showFooterRow = true
        this.gridOptions.createFooterRow = true
        this.gridOptions.enableCheckboxSelector = true
        this.gridOptions.rowSelectionOptions = {
            selectActiveRow: false
        }
    }

    ngAfterViewInit(): void {
    }

    async angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid.detail
        this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
            totalRecords(this.angularGrid,'cliente')
            columnTotal('facturacion', this.angularGrid)
        })
        if (this.apiService.isMobile())
            this.angularGrid.gridService.hideColumnByIds([])
    }

    handleSelectedRowsChanged(e: any): void {
        this.rows = e.detail.args.rows
        if(e.detail.args.rows.length == 1){
            const selrow = this.angularGrid.dataView.getItemByIdx(e.detail.args.rows[0])
            // console.log('selrow',selrow);
            this.editCustodiaId.set(selrow.id)
            if (selrow.estado.tipo === 4)
                this.estado.set(false)
            else
                this.estado.set(true)
        }else{
            this.editCustodiaId.set(0)
            this.estado.set(false)
        }
        // console.log(this.editCustodiaId(), this.estado(), this.rows, this.angularGrid.dataView.getAllSelectedFilteredIds());
    }

    getGridData(): void {
        this.listCustodia$.next('');
    }

    listOptionsChange(options: any) {
        this.listOptions = options;
        this.listCustodia$.next('');
    }

    setEdit(value: boolean): void {
        this.edit.set(value)
    }

    setVisible(value: boolean): void {
        this.visible.set(value)
    }

    async save() {
        this.isLoading.set(true)
        // const form = this.formCusEstado.value
        // console.log('form', form);
        try {
            console.log({...this.formCusEstado.value, ids: this.angularGrid.dataView.getAllSelectedFilteredIds() })
            this.formCusEstado.markAsUntouched()
            this.formCusEstado.markAsPristine()
        } catch (e) {
            
        }
        this.isLoading.set(false)
    }
}