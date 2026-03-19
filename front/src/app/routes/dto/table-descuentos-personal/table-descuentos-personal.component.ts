import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, computed, input, Injector, resource, } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption, Column } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { firstValueFrom } from 'rxjs';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { DescuentosPersonalAltaDrawerComponent } from "../descuentos-personal-alta-drawer/descuentos-personal-alta-drawer.component"
import { LoadingService } from '@delon/abc/loading';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Selections } from 'src/app/shared/schemas/filtro';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-table-descuentos-personal',
    templateUrl: './table-descuentos-personal.component.html',
    styleUrls: ['./table-descuentos-personal.component.less'],
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule, FiltroBuilderComponent, DescuentosPersonalAltaDrawerComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableDescuentosPersonalComponent {
    angularGrid!: AngularGridInstance;
    gridOptions!: GridOption;
    rows: number[] = [];
    detailViewRowCount = 1;
    excelExportService = new ExcelExportService();
    anio = input<number>(0)
    mes = input<number>(0)
    reload = input<number>(0)

    listOptions = signal<listOptionsT>({
        filtros: [],
        sort: null
    })

    startFilters = signal<Selections[]>([]);

    columnDefinitions: Column[] = []
    descuentoId = signal<number>(0)
    periodo = input<any>(null)
    personalId = signal<number>(0)
    visibleAltaDesc = signal<boolean>(false)
    visibleEditDesc = signal<boolean>(false)
    tipoint = signal<string>('')
    disabledForm = signal(false)
    cancelDesc = signal(false)
    isAnulacion = signal(false)
    private apiService =inject(ApiService)
    private angularUtilService= inject(AngularUtilService)

    private readonly loadingSrv = inject(LoadingService)
    private notification = inject(NzNotificationService)


    columns = toSignal(this.apiService.getCols('/api/gestion-descuentos/cols/personal'), { initialValue: [] as Column[] })

    gridData = resource({
        params: () => ({ options: this.listOptions(), anio: this.anio(), mes: this.mes(), reload: this.reload() }),
        loader: async ({ params }) => {
            let response = []
            this.loadingSrv.open({ type: 'spin', text: '' })
            try {
                response = await firstValueFrom(this.apiService.getDescuentosPersonal(params.options, params.anio, params.mes));
            } catch (_e) { }
            this.loadingSrv.close()

            return response || [];
        },

        defaultValue: []
    });


    async ngOnInit() {

        this.gridOptions = this.apiService.getDefaultGridOptions('.gridDescPersonal', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptions.enableRowDetailView = false
        this.gridOptions.enableAutoSizeColumns = true
        this.gridOptions.fullWidthRows = true
        this.gridOptions.showFooterRow = true
        this.gridOptions.createFooterRow = true

    }

    handleSelectedRowsChanged(e: any): void {
        if (e.detail.args.changedSelectedRows.length == 1) {
            const rowNum = e.detail.args.changedSelectedRows[0]
            const row = this.angularGrid.dataView.getItemByIdx(rowNum)
            this.tipoint.set(row?.tipoint)
            const id: string = row?.id
            const ids: string[] = row?.perdes_id.split('-')
            this.descuentoId.set(parseInt(ids[1]))
            this.personalId.set(parseInt(ids[2]))
        } else {
            this.descuentoId.set(0)
            this.personalId.set(0)
        }
    }

    async angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid.detail
//        this.gridData = angularGrid.dataView
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

    openDrawerforAltaDescuentos() {
        this.visibleAltaDesc.set(true)
        this.isAnulacion.set(false)
    }

    openDrawerforEditDescuentos() {
        if (this.tipoint() == 'OTRO') {
            this.cancelDesc.set(false)
            this.disabledForm.set(false)
            this.visibleEditDesc.set(true)
            this.isAnulacion.set(false)
        } else {
            this.notification.warning(`Advertencia`, `No se puede modificar el registro seleccionado. Se debera modificar desde el modulo correspondiente. Tipoint: ${this.tipoint()}`);
        }
    }

    openDrawerforDetailDescuentos() {
        if (this.tipoint() == 'OTRO') {
            this.cancelDesc.set(false)
            this.disabledForm.set(true)
            this.visibleEditDesc.set(true)
            this.isAnulacion.set(false)
        } else {
            this.notification.warning(`Advertencia`, `No se puede modificar el registro seleccionado. Se debera modificar desde el modulo correspondiente. Tipoint: ${this.tipoint()}`);
        }
    }

    openDrawerforCancelDescuentos() {
        if (this.tipoint() == 'OTRO') {
            this.disabledForm.set(true)
            this.cancelDesc.set(true)
            this.visibleEditDesc.set(true)
            this.isAnulacion.set(true)
        } else {
            this.notification.warning(`Advertencia`, `No se puede modificar el registro seleccionado. Se debera modificar desde el modulo correspondiente. Tipoint: ${this.tipoint()}`);
        }
    }

    openDrawerforViewDescuentos() {
        if (this.tipoint() == 'OTRO') {
            this.disabledForm.set(true)
            this.visibleEditDesc.set(true)
            this.isAnulacion.set(false)
        } else {
            this.notification.warning(`Advertencia`, `No se puede modificar el registro seleccionado. Se debera modificar desde el modulo correspondiente. Tipoint: ${this.tipoint()}`);
        }
    }

    onAddorUpdate(_e: any) {
        this.gridData.reload()
    }
}