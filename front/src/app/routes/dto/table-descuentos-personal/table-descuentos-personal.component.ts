import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, computed, input, Injector, } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption, Column} from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { DescuentosPersonalAltaDrawerComponent } from "../descuentos-personal-alta-drawer/descuentos-personal-alta-drawer.component"

@Component({
    selector: 'app-table-descuentos-personal',
    templateUrl: './table-descuentos-personal.component.html',
    styleUrls: ['./table-descuentos-personal.component.less'],
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [ SHARED_IMPORTS, CommonModule, FiltroBuilderComponent, DescuentosPersonalAltaDrawerComponent ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableDescuentosPersonalComponent {
    angularGrid!: AngularGridInstance;
    gridOptions!: GridOption;
    gridData: any;
    rows: number[] = [];
    detailViewRowCount = 1;
    excelExportService = new ExcelExportService();
    anio = input<number>(0)
    mes = input<number>(0)
    listDescuento$ = new BehaviorSubject('');
    listOptions: listOptionsT = {
        filtros: [],
        sort: null,
    };
    startFilters: any[] = []
    columnDefinitions: Column[] = []
    descuentoId = signal<number>(0)
    personalId = signal<number>(0)
    visibleAltaDesc = signal<boolean>(false)
    visibleEditDesc = signal<boolean>(false)
    loadingDelete = signal<boolean>(false)

    constructor(
        private searchService: SearchService,
        private apiService: ApiService,
        private angularUtilService : AngularUtilService,
        private injector : Injector,
    ) {}

    columns$ = this.apiService.getCols('/api/gestion-descuentos/cols/personal')

    gridData$ = this.listDescuento$.pipe(
        debounceTime(500),
        switchMap(() => {
            return this.apiService.getDescuentosPersonal(this.listOptions, this.anio(), this.mes())
                .pipe(map(data => { return data }))
        })
    )

    async ngOnInit() {
        this.gridOptions = this.apiService.getDefaultGridOptions('.gridDescPersonal', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptions.enableRowDetailView = false
        this.gridOptions.enableAutoSizeColumns = true
        this.gridOptions.fullWidthRows = true
        this.gridOptions.showFooterRow = true
        this.gridOptions.createFooterRow = true

        effect(async () => {
            const anio = this.anio()
            const mes = this.mes()
            this.listDescuento('')
        }, { injector: this.injector });
    }

    handleSelectedRowsChanged(e: any): void {
        if (e.detail.args.changedSelectedRows.length ==1) {
            const rowNum = e.detail.args.changedSelectedRows[0]
            const id:string = this.angularGrid.dataView.getItemByIdx(rowNum)?.id
            const ids:string[] = id.split('-')
            this.descuentoId.set(parseInt(ids[1]))
            this.personalId.set(parseInt(ids[2]))
        } else {
            this.descuentoId.set(0)
            this.personalId.set(0)
        }
    }

    async angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid.detail
        this.gridData = angularGrid.dataView
        this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
            totalRecords(this.angularGrid, 'tipocuenta_id')
            columnTotal('importe', this.angularGrid)
            columnTotal('cuotanro', this.angularGrid)
            columnTotal('cantcuotas', this.angularGrid)
            columnTotal('importetotal', this.angularGrid)
        })
        if (this.apiService.isMobile())
            this.angularGrid.gridService.hideColumnByIds([])
    }

    listOptionsChange(options: any) {
        this.listOptions = options;
        this.listDescuento('')
    }

    listDescuento(event: any) {
        this.listDescuento$.next(event);
    }

    openDrawerforAltaDescuentos(){
        this.visibleAltaDesc.set(true)
    }

    openDrawerforEditDescuentos(){
        this.visibleEditDesc.set(true)
    }

    async deleteDescuento(){
        this.loadingDelete.set(true)
        try {
            if (this.descuentoId() && this.personalId()) {
            await firstValueFrom(this.apiService.deletePersonalOtroDescuento(this.descuentoId(), this.personalId()))
            this.listDescuento('')
        }
        } catch (error) {}
        this.loadingDelete.set(false)
    }

    onAddorUpdate(_e:any) {
        this.listDescuento('')
    }
}