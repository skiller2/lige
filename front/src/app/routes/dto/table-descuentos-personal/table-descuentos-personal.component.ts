import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, computed, input, Injector, } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption, Column} from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { DescuentosPersonalAltaDrawerComponent } from "../descuentos-personal-alta-drawer/descuentos-personal-alta-drawer.component"
import { LoadingService } from '@delon/abc/loading';
import { NzNotificationService } from 'ng-zorro-antd/notification';

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
    reload = input<number>(0)
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
    tipoint = signal<string>('')
    disabledForm = signal(false);
    cancelDesc = signal(false);

    constructor(
        // private searchService: SearchService,
        private apiService: ApiService,
        private angularUtilService : AngularUtilService,
        // private injector : Injector,
    ) {
        effect(async () => {
            const anio = this.anio()
            const mes = this.mes()
            const reload = this.reload()
            this.listDescuento('')
        });
    }

    private readonly loadingSrv = inject(LoadingService);
    private notification = inject(NzNotificationService)

    columns$ = this.apiService.getCols('/api/gestion-descuentos/cols/personal')

    gridData$ = this.listDescuento$.pipe(
        debounceTime(500),
        switchMap(() => {
            this.loadingSrv.open({ type: 'spin', text: '' })
            return this.apiService.getDescuentosPersonal(this.listOptions, this.anio(), this.mes())
            .pipe(
                map(data => { return data }),
                doOnSubscribe(() => { }),
                tap({ complete: () => { this.loadingSrv.close() } })
            )
        })
    )

    async ngOnInit() {
        this.gridOptions = this.apiService.getDefaultGridOptions('.gridDescPersonal', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptions.enableRowDetailView = false
        this.gridOptions.enableAutoSizeColumns = true
        this.gridOptions.fullWidthRows = true
        this.gridOptions.showFooterRow = true
        this.gridOptions.createFooterRow = true
    }

    handleSelectedRowsChanged(e: any): void {
        if (e.detail.args.changedSelectedRows.length ==1) {
            const rowNum = e.detail.args.changedSelectedRows[0]
            const row = this.angularGrid.dataView.getItemByIdx(rowNum)
            this.tipoint.set(row?.tipoint)
            const id:string = row?.id
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
        if (this.tipoint() == 'OTRO') {
            this.cancelDesc.set(false)
            this.disabledForm.set(false)
            this.visibleEditDesc.set(true)
        }else{
            this.notification.warning('Advertencia', `'No se puede modificar el registro seleccionado. Se debera modificar desde el modulo correspondiente.`);
        }
    }

    openDrawerforDetailDescuentos(){
        if (this.tipoint() == 'OTRO') {
            this.cancelDesc.set(false)
            this.disabledForm.set(true)
            this.visibleEditDesc.set(true)
        }else{
            this.notification.warning('Advertencia', `'No se puede modificar el registro seleccionado. Se debera modificar desde el modulo correspondiente.`);
        }
    }

    openDrawerforCancelDescuentos(){
        if (this.tipoint() == 'OTRO') {
            this.disabledForm.set(false)
            this.cancelDesc.set(true)
            this.visibleEditDesc.set(true)
        }else{
            this.notification.warning('Advertencia', `'No se puede modificar el registro seleccionado. Se debera modificar desde el modulo correspondiente.`);
        }
    }

    openDrawerforViewDescuentos(){
        if (this.tipoint() == 'OTRO') {
            this.disabledForm.set(true)
            this.visibleEditDesc.set(true)
        }else{
            this.notification.warning('Advertencia', `'No se puede modificar el registro seleccionado. Se debera modificar desde el modulo correspondiente.`);
        }
    }

    onAddorUpdate(_e:any) {
        this.listDescuento('')
    }
}