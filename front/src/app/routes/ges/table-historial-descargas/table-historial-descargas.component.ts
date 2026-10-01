import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { Component, input, inject, ViewChild, signal, resource } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AngularGridInstance, AngularUtilService, Column, GridOption, FileType} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { CustomLinkComponent } from '../../../shared/custom-link/custom-link.component';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { Selections } from '../../../shared/schemas/filtro';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoadingService } from '@delon/abc/loading';

@Component({
    selector: 'app-table-historial-descargas',
    templateUrl: './table-historial-descargas.component.html',
    styleUrl: './table-historial-descargas.component.less',
    imports: [SHARED_IMPORTS, NzUploadModule, NzDescriptionsModule, CommonModule, FiltroBuilderComponent, NzAffixModule]
})

export class TableHistorialDescargasComponent {
    @ViewChild('thd', { static: false }) sharedFiltroBuilder!: FiltroBuilderComponent;

    private readonly loadingSrv = inject(LoadingService)
    private angularUtilServicePersonal = inject(AngularUtilService)
    private searchService = inject(SearchService)
    private apiService = inject(ApiService)

    angularGrid!: AngularGridInstance;
    gridDetalleOptions!: GridOption;
    excelExportService = new ExcelExportService();
    detailViewRowCount = 1;

    docId = input(0)
    listOptions = signal<listOptionsT>({
        filtros: [],
        sort: null,
    });
    startFilters = signal<Selections[]>([])

    columns = toSignal(this.apiService.getCols(`/api/documento/cols-download`), { initialValue: [] as Column[] })

    gridData = resource({
        params: () => ({ options: this.listOptions() }),
        loader: async ({ params }) => {
        let response = []
        this.loadingSrv.open({ type: 'spin', text: '' })
        try {
            const res = await firstValueFrom(this.searchService.getDocumentoDownloadList(this.docId(), params.options));
            response = res.list;
        } catch (error) {}
        
        this.loadingSrv.close()
        return response || [];
        },
        defaultValue: []
    });

    async ngOnInit() {
        this.gridDetalleOptions = this.apiService.getDefaultGridOptions('.gridDescargasContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilServicePersonal, this, RowDetailViewComponent)
        this.gridDetalleOptions.enableRowDetailView = false
        this.gridDetalleOptions.enableAutoSizeColumns = true
        this.gridDetalleOptions.showFooterRow = true
        this.gridDetalleOptions.createFooterRow = true

        this.startFilters.set([
            {index:'SituacionRevistaId', condition:'AND', operator:'=', value:'2;10;11;12;20', closeable: true},
        ])
    }

    ngOnDestroy() {
    }

    async angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid.detail
        this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
            totalRecords(this.angularGrid, 'ApellidoNombre')
        })
        if (this.apiService.isMobile())
            this.angularGrid.gridService.hideColumnByIds([])

    }

    renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
        const componentOutput = this.angularUtilServicePersonal.createAngularComponent(CustomLinkComponent)
        cellNode.replaceChildren(componentOutput.domElement)
    }

}