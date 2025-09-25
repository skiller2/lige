import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, computed, input, Injector } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption, Column } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { LoadingService } from '@delon/abc/loading';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { DescuentosObjetivosAltaDrawerComponent } from "../descuentos-objetivos-alta-drawer/descuentos-objetivos-alta-drawer.component"

@Component({
    selector: 'app-table-descuentos-objetivos',
    templateUrl: './table-descuentos-objetivos.component.html',
    styleUrls: ['./table-descuentos-objetivos.component.less'],
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent, DescuentosObjetivosAltaDrawerComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableDescuentosObjetivosComponent {
    angularGrid!: AngularGridInstance;
    gridOptions!: GridOption;
    gridData: any;
    rows: number[] = [];
    detailViewRowCount = 1;
    reloadGrid = model<boolean>(false)
    excelExportService = new ExcelExportService();
    anio = input<number>(0)
    mes = input<number>(0)
    reload = input<number>(0)
    listDescuento$ = new BehaviorSubject('');
    listOptions: listOptionsT = {
        filtros: [],
        sort: null,
    };
    startFilters: any[] = []
    columnDefinitions: Column[] = []
    ObjetivoDescuentoId = signal<number>(0)
    objetivoId = signal<number>(0)
    visibleAltaDesc = signal<boolean>(false)
    visibleEditDesc = signal<boolean>(false)
    disabledForm = signal(false);
    cancelDesc = signal(false);
    isAnulacion = signal(false);
    constructor(
        // private searchService: SearchService,
        private apiService: ApiService,
        private angularUtilService: AngularUtilService,
        // private injector : Injector,
    ) {
        effect(async () => {
            const anio = this.anio()
            const mes = this.mes()
            const reload = this.reload()
            this.listDescuento('')
            this.reloadGrid();
            this.reloadGrid.set(false)
        });
    }

    private readonly loadingSrv = inject(LoadingService);

    columns$ = this.apiService.getCols('/api/gestion-descuentos/cols/objetivos')

    gridData$ = this.listDescuento$.pipe(
        debounceTime(500),
        switchMap(() => {
            this.loadingSrv.open({ type: 'spin', text: '' })
            return this.apiService.getDescuentosObjetivos(this.listOptions, this.anio(), this.mes())
                .pipe(
                    map(data => { return data }),
                    doOnSubscribe(() => { }),
                    tap({ complete: () => { this.loadingSrv.close() } })
                )
        })
    )

    async ngOnInit() {
        this.gridOptions = this.apiService.getDefaultGridOptions('.gridDescObjetivos', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptions.enableRowDetailView = false
        this.gridOptions.enableAutoSizeColumns = true
        this.gridOptions.fullWidthRows = true
        this.gridOptions.showFooterRow = true
        this.gridOptions.createFooterRow = true
    }

    async angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid.detail
        this.gridData = angularGrid.dataView
        this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
            totalRecords(this.angularGrid, 'objetivo')
            columnTotal('importe', this.angularGrid)
            columnTotal('cuotanro', this.angularGrid)
            columnTotal('cantcuotas', this.angularGrid)
            columnTotal('importetotal', this.angularGrid)
        })
        if (this.apiService.isMobile())
            this.angularGrid.gridService.hideColumnByIds([])
    }

    handleSelectedRowsChanged(e: any): void {
        if (e.detail.args.changedSelectedRows.length == 1) {
            const rowNum = e.detail.args.changedSelectedRows[0]
            const row = this.angularGrid.dataView.getItemByIdx(rowNum)
            this.ObjetivoDescuentoId.set(Number(row?.ObjetivoDescuentoId))
            this.objetivoId.set(row?.objetivo.id)
        } else {
            this.ObjetivoDescuentoId.set(0)
            this.objetivoId.set(0)
        }
    }

    listOptionsChange(options: any) {
        this.listOptions = options;
        this.listDescuento('')
    }

    listDescuento(event: any) {
        this.listDescuento$.next(event);
    }

    openDrawerforAltaDescuentos() {
        this.visibleAltaDesc.set(true)
        this.isAnulacion.set(false)
    }

    openDrawerforEditDescuentos() {
        this.disabledForm.set(false)
        this.cancelDesc.set(false)
        this.visibleEditDesc.set(true)
        this.isAnulacion.set(false)
    }

    openDrawerforDetailDescuentos() {
        this.cancelDesc.set(false)
        this.disabledForm.set(true)
        this.visibleEditDesc.set(true)
        this.isAnulacion.set(false)
    }

    openDrawerforCancelDescuentos() {
        this.disabledForm.set(true)
        this.cancelDesc.set(true)
        this.visibleEditDesc.set(true)
        this.isAnulacion.set(true)
    }

    onAddorUpdate(_e: any) {
        this.listDescuento('')
    }
}