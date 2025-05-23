import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, ViewChild, signal, TemplateRef, Injector, effect } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { CommonModule } from '@angular/common';
import { AngularGridInstance, AngularUtilService, Column, GridOption, FileType} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { CustomLinkComponent } from 'src/app/shared/custom-link/custom-link.component';
import { NzAffixModule } from 'ng-zorro-antd/affix';

@Component({
    selector: 'app-table-historial-descargas',
    templateUrl: './table-historial-descargas.component.html',
    styleUrl: './table-historial-descargas.component.less',
    imports: [SHARED_IMPORTS, NzUploadModule, NzDescriptionsModule, CommonModule, FiltroBuilderComponent, NzAffixModule]
})

export class TableHistorialDescargasComponent {
    @ViewChild('thd', { static: false }) sharedFiltroBuilder!: FiltroBuilderComponent;

    angularGrid!: AngularGridInstance;
    gridDetalleOptions!: GridOption;
    excelExportService = new ExcelExportService();
    list$ = new BehaviorSubject('');
    docId = input(0)
    listOptions: listOptionsT = {
        filtros: [],
        sort: null,
    };
    detailViewRowCount = 1;
    startFilters: any[]=[]

    private angularUtilServicePersonal = inject(AngularUtilService)
    private searchService = inject(SearchService)
    private apiService = inject(ApiService)
    private injector = inject(Injector)

    columns$ = this.apiService.getCols(`/api/documento/cols-download`)

    gridData$ = this.list$.pipe(
        debounceTime(500),
        switchMap(() => {
            return this.searchService.getDocumentoDownloadList(this.docId(), this.listOptions)
            .pipe(map(data => { return data.list }))
        })
    )

    async ngOnInit() {
        this.gridDetalleOptions = this.apiService.getDefaultGridOptions('.gridDescargasContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilServicePersonal, this, RowDetailViewComponent)
        this.gridDetalleOptions.enableRowDetailView = false
        this.gridDetalleOptions.enableAutoSizeColumns = true
        this.gridDetalleOptions.showFooterRow = true
        this.gridDetalleOptions.createFooterRow = true

        this.startFilters = [
            {field:'SituacionRevistaId', condition:'AND', operator:'=', value:'2;10;11;12;20', forced:false},
        ]
    }

    ngOnDestroy() {
    }

    list(event: any) {
        this.list$.next(event);
    }

    async angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid.detail
        this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
            totalRecords(this.angularGrid, 'ApellidoNombre')
        })
        if (this.apiService.isMobile())
            this.angularGrid.gridService.hideColumnByIds([])

    }

    listOptionsChange(options: any) {
        this.listOptions = options;
        this.list('')
    }

    renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
        const componentOutput = this.angularUtilServicePersonal.createAngularComponent(CustomLinkComponent)
        cellNode.replaceChildren(componentOutput.domElement)
    }

}