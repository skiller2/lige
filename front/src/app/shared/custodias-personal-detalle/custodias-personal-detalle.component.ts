import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, ViewChild, signal, TemplateRef, Injector, effect } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { NgForm } from '@angular/forms';
import { PersonalSearchComponent } from '../personal-search/personal-search.component';
import { CommonModule } from '@angular/common';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters, Grouping, SlickGrid } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { columnTotal, totalRecords } from "../custom-search/custom-search"
import { FiltroBuilderComponent } from "../filtro-builder/filtro-builder.component";
import { CustomLinkComponent } from 'src/app/shared/custom-link/custom-link.component';
import { NzAffixModule } from 'ng-zorro-antd/affix';

@Component({
    selector: 'app-custodias-personal-detalle',
    standalone: true,
    imports: [SHARED_IMPORTS, NzUploadModule, NzDescriptionsModule,
        PersonalSearchComponent, CommonModule, FiltroBuilderComponent, NzAffixModule],
    templateUrl: './custodias-personal-detalle.component.html',
    styleUrl: './custodias-personal-detalle.component.less',
})

export class CustodiasPersonalDetalleComponent {
    @ViewChild('sfb', { static: false }) sharedFiltroBuilder!: FiltroBuilderComponent;

    angularGrid!: AngularGridInstance;
    gridDetalleOptions!: GridOption;
    excelExportService = new ExcelExportService();
    periodo = input(new Date())
    listCustodiaPersonal$ = new BehaviorSubject('');
    listOptions: listOptionsT = {
        filtros: [],
        sort: null,
    };
    detailViewRowCount = 1;
    placement: NzDrawerPlacement = 'left';
    startFilters: { field: string; condition: string; operator: string; value: string; forced: boolean }[] = []

    private angularUtilServicePersonal = inject(AngularUtilService)
    private searchService = inject(SearchService)
    private apiService = inject(ApiService)
    private injector = inject(Injector)
    public grupo = signal('persona')

    columns$ = this.apiService.getCols('/api/custodia/personalcols').pipe(map((cols: any) => {
        let mapped:any = cols.map((col: Column) => {
            if (col.id == "importe") {
                col.groupTotalsFormatter = this.sumTotalsFormatterCustom

//                col.groupTotalsFormatter = GroupTotalFormatters['sumTotalsCurrencyFormatter']

            }
            return col
        });
        return mapped
    }))

    gridDetalleData$ = this.listCustodiaPersonal$.pipe(
        debounceTime(500),
        switchMap(() => {
            return this.searchService.getListaPersonalCustodia(this.listOptions , this.periodo())
                .pipe(map(data => { return data }))
        })
    )

    async ngOnInit() {
        this.gridDetalleOptions = this.apiService.getDefaultGridOptions('.gridDetalleContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilServicePersonal, this, RowDetailViewComponent)
        this.gridDetalleOptions.enableRowDetailView = false
        this.gridDetalleOptions.editable = false
        this.gridDetalleOptions.autoEdit = true
        this.gridDetalleOptions.enableAutoSizeColumns = true
        this.gridDetalleOptions.showFooterRow = true
        this.gridDetalleOptions.createFooterRow = true

        this.gridDetalleOptions.enableGrouping = true
        // this.gridDetalleOptions.createTopHeaderPanel = true
        // this.gridDetalleOptions.showTopHeaderPanel = true
        // this.gridDetalleOptions.topHeaderPanelHeight = 35

        // this.gridDetalleOptions.createPreHeaderPanel = true
        // this.gridDetalleOptions.showPreHeaderPanel = true
        // this.gridDetalleOptions.preHeaderPanelHeight = 26

        effect(async () => {
            const periodo = this.periodo()
            this.listCustodiaPersonal('')
        }, { injector: this.injector });
    }

    ngOnDestroy() {
    }

    listCustodiaPersonal(event: any) {
        this.listCustodiaPersonal$.next(event);
    }

    async angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid.detail
        this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
            totalRecords(this.angularGrid, 'ApellidoNombre')
            columnTotal('importe', this.angularGrid)
        })
        if (this.apiService.isMobile())
            this.angularGrid.gridService.hideColumnByIds([])
        this.changeGrupo('persona')

    }

    listOptionsChange(options: any) {
        this.listOptions = options;
        this.listCustodiaPersonal('')
    }

    exportGrid() {
        this.excelExportService.exportToExcel({
          filename: 'detalle-personal-custodia',
          format: FileType.xlsx
        });
    }

    renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
        const componentOutput = this.angularUtilServicePersonal.createAngularComponent(CustomLinkComponent)
        cellNode.replaceChildren(componentOutput.domElement)
    }

    
    sumTotalsFormatterCustom(totals: any, columnDef: Column, grid:SlickGrid) {
        const val = totals.sum && totals.sum[columnDef.field]
        return  String((columnDef.formatter) ? columnDef.formatter(0, 0, val, columnDef, null, grid) : val)
    }

    changeGrupo(grupo: any) {
        let grouping:Grouping
        switch (grupo) {
            case 'persona':
                grouping = {
                    getter: 'ApellidoNombre',
                    aggregators: [new Aggregators['Sum']('importe')],
                    formatter: (g) => `${g.value} (${g.count} items)`,
                    aggregateCollapsed: true,
                    lazyTotalsCalculation: true,
                };
                break;
            case 'tipotipoimporte':
                grouping = {
                    getter: 'tipo_importe',
                    aggregators: [new Aggregators['Sum']('importe')],
                    formatter: (g) => `${g.value} (${g.count} items)`,
                    aggregateCollapsed: true,
                    lazyTotalsCalculation: true,
                };
                break;
        
            default:
                grouping = {}
                break;
        }
        this.angularGrid.dataView.setGrouping(grouping);
        this.angularGrid.slickGrid.invalidate()

    }
}