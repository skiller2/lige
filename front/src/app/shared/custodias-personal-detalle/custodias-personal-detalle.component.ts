import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef, Injector, effect } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { PersonalSearchComponent } from '../personal-search/personal-search.component';
import { CommonModule } from '@angular/common';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { columnTotal, totalRecords } from "../custom-search/custom-search"
import { CustomLinkComponent } from 'src/app/shared/custom-link/custom-link.component';

@Component({
    selector: 'app-custodias-personal-detalle',
    standalone: true,
    imports: [SHARED_IMPORTS, NzUploadModule, NzDescriptionsModule, ReactiveFormsModule, PersonalSearchComponent, CommonModule],
    templateUrl: './custodias-personal-detalle.component.html',
    styleUrl: './custodias-personal-detalle.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class CustodiasPersonalDetalleComponent {
    angularGridPersonal!: AngularGridInstance;
    gridOptionsPersonal!: GridOption;
    gridDataInsertPersonal: any[] = [];
    excelExportServicePersonal = new ExcelExportService();
    periodo = input(new Date())
    listCustodiaPersonal$ = new BehaviorSubject('');
    listOptions: listOptionsT = {
        filtros: [],
        sort: null,
    };
    detailViewRowCount = 1;
    placement: NzDrawerPlacement = 'left';

    private angularUtilServicePersonal = inject(AngularUtilService)
    private searchService = inject(SearchService)
    private apiService = inject(ApiService)
    private injector = inject(Injector)

    columnsPersonal$ = this.apiService.getCols('/api/custodia/personalcols')

    gridDataPersonal$ = this.listCustodiaPersonal$.pipe(
        debounceTime(500),
        switchMap(() => {
            return this.searchService.getListaPersonalCustodia(this.listOptions , this.periodo())
                .pipe(map(data => { return data }))
        })
    )

    async ngOnInit() {
        this.gridOptionsPersonal = this.apiService.getDefaultGridOptions('.gridDetalleContainer', this.detailViewRowCount, this.excelExportServicePersonal, this.angularUtilServicePersonal, this, RowDetailViewComponent)
        this.gridOptionsPersonal.enableRowDetailView = false
        this.gridOptionsPersonal.editable = false
        this.gridOptionsPersonal.autoEdit = true
        this.gridOptionsPersonal.enableAutoSizeColumns = true
        this.gridOptionsPersonal.showFooterRow = true
        this.gridOptionsPersonal.createFooterRow = true
        effect(async () => {
            // console.log('PERIODO',this.periodo());
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
        console.log('PERSONAL.');
        
        this.angularGridPersonal = angularGrid.detail
        this.angularGridPersonal.dataView.onRowsChanged.subscribe((e, arg) => {
            totalRecords(this.angularGridPersonal, 'ApellidoNombre')
            // columnTotal('facturacion', this.angularGrid)
        })
        if (this.apiService.isMobile())
            this.angularGridPersonal.gridService.hideColumnByIds([])
    }

    exportGrid() {
        this.excelExportServicePersonal.exportToExcel({
          filename: 'detalle-personal-custodia',
          format: FileType.xlsx
        });
    }

}