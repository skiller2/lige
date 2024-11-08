import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, ViewChild, signal, TemplateRef, Injector, effect } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { NgForm } from '@angular/forms';
import { PersonalSearchComponent } from '../personal-search/personal-search.component';
import { CommonModule } from '@angular/common';
import { AngularGridInstance, AngularUtilService, GridOption, FileType, SlickGrid, Column } from 'angular-slickgrid';
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

    columns$ = this.apiService.getCols('/api/custodia/personalcols')

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
            // columnTotal('facturacion', this.angularGrid)
        })
        if (this.apiService.isMobile())
            this.angularGrid.gridService.hideColumnByIds([])
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

}