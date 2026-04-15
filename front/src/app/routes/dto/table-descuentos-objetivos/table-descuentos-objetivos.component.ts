import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, inject, ChangeDetectionStrategy, signal, model, computed, input, resource } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption, Column } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { firstValueFrom } from 'rxjs';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { LoadingService } from '@delon/abc/loading';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { DescuentosObjetivosAltaDrawerComponent } from "../descuentos-objetivos-alta-drawer/descuentos-objetivos-alta-drawer.component"
import { toSignal } from '@angular/core/rxjs-interop';
import { Selections } from '../../../shared/schemas/filtro';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
    selector: 'app-table-descuentos-objetivos',
    templateUrl: './table-descuentos-objetivos.component.html',
    styleUrls: ['./table-descuentos-objetivos.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent, DescuentosObjetivosAltaDrawerComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableDescuentosObjetivosComponent {
    private readonly loadingSrv = inject(LoadingService);
    private apiService = inject(ApiService)
    private angularUtilService = inject(AngularUtilService)
    private notification = inject(NzNotificationService)

    angularGrid!: AngularGridInstance;
    gridOptions!: GridOption;
    rows: number[] = [];
    detailViewRowCount = 1;
    reload = input<number>(0)
    excelExportService = new ExcelExportService();
    anio = input<number>(0)
    mes = input<number>(0)
    listOptions = signal<listOptionsT>({
        filtros: [],
        sort: null
    })
    startFilters = signal<Selections[]>([]);
    ObjetivoDescuentoId = signal<number>(0)
    objetivoId = signal<number>(0)
    tipodescuento = signal<number>(0)
    visibleAltaDesc = signal<boolean>(false)
    visibleEditDesc = signal<boolean>(false)
    // disabledForm = signal(false);
    // cancelDesc = signal(false);
    // isAnulacion = signal(false);
    crudAccion = signal<string>('')

    columns = toSignal(this.apiService.getCols('/api/gestion-descuentos/cols/objetivos'), { initialValue: [] as Column[] })

    gridData = resource({
        params: () => ({ options: this.listOptions(), anio: this.anio(), mes: this.mes(), reload: this.reload() }),
        loader: async ({ params }) => {
            let response = []
            this.loadingSrv.open({ type: 'spin', text: '' })
            try {
                response = await firstValueFrom(this.apiService.getDescuentosObjetivos(params.options, params.anio, params.mes));
            } catch (_e) { }
            this.loadingSrv.close()

            return response || [];
        },

        defaultValue: []
    });



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
        //this.gridData = angularGrid.dataView
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
            this.tipodescuento.set(Number(row?.DescuentoId))
        } else {
            this.ObjetivoDescuentoId.set(0)
            this.objetivoId.set(0)
            this.tipodescuento.set(0)
        }
    }

    openDrawerforAltaDescuentos() {
        this.visibleAltaDesc.set(true)
        // this.isAnulacion.set(false)
        this.crudAccion.set('C')
    }

    openDrawerforEditDescuentos() {
        if (this.tipodescuento() != 46) {
            // this.disabledForm.set(false)
            // this.cancelDesc.set(false)
            this.visibleEditDesc.set(true)
            // this.isAnulacion.set(false)
            this.crudAccion.set('U')
        } else {
            this.notification.warning('Advertencia', `No se puede modificar el registro seleccionado. Se debera modificar desde el modulo correspondiente. Tipodescuento: ${this.tipodescuento()}`)
        }
    }

    openDrawerforDetailDescuentos() {
        if (this.tipodescuento() != 46) {
            // this.cancelDesc.set(false)
            // this.disabledForm.set(true)
            this.visibleEditDesc.set(true)
            // this.isAnulacion.set(false)
            this.crudAccion.set('R')
        } else {
            this.notification.warning('Advertencia', `No se puede modificar el registro seleccionado. Se debera modificar desde el modulo correspondiente. Tipodescuento: ${this.tipodescuento()}`)
        }
    }

    openDrawerforCancelDescuentos() {
        if (this.tipodescuento() != 46) {
            // this.disabledForm.set(true)
            // this.cancelDesc.set(true)
            this.visibleEditDesc.set(true)
            // this.isAnulacion.set(true)
            this.crudAccion.set('D')
        } else {
            this.notification.warning('Advertencia', `No se puede modificar el registro seleccionado. Se debera modificar desde el modulo correspondiente. Tipodescuento: ${this.tipodescuento()}`)
        }
    }

    onAddorUpdate(_e: any) {
        this.gridData.reload()
    }
}