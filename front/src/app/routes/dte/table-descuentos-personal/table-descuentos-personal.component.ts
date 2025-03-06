import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, computed, input } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption} from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
@Component({
    selector: 'app-table-descuentos-personal',
    templateUrl: './table-descuentos-personal.component.html',
    styleUrls: ['./table-descuentos-personal.component.less'],
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [ SHARED_IMPORTS, CommonModule, FiltroBuilderComponent ],
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


    constructor(
        private searchService: SearchService,
        private apiService: ApiService,
        private angularUtilService : AngularUtilService,
    ) {
        effect(() => {
            const anio = this.anio()
            const mes = this.mes()
            this.listDescuento('')
        });
    }

    columns$ = this.apiService.getCols('/api/gestion-descuentos/cols')

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
        this.gridOptions.showFooterRow = true
        this.gridOptions.createFooterRow = true
    }

    async angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid.detail
        this.gridData = angularGrid.dataView
        this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
            // totalRecords(this.angularGrid, 'cliente')
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
}