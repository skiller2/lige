import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { CustodiaFormComponent } from "../custodias-form/custodias-form.component";
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { FormBuilder, FormArray } from '@angular/forms';

@Component({
    selector: 'app-custodias',
    templateUrl: './custodias.component.html',
    styleUrls: ['./custodias.component.less'],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule, PersonalSearchComponent, ClienteSearchComponent, DetallePersonaComponent, FiltroBuilderComponent, CustodiaFormComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,

})
export class CustodiaComponent {
    public router = inject(Router);
    public route = inject(ActivatedRoute);

    angularGrid!: AngularGridInstance;
    gridOptions!: GridOption;
    gridDataInsert: any[] = [];
    rows: number[] = [];
    detailViewRowCount = 1;
    editCustodiaId = model(0);
    estado = signal(true);
    edit = signal(false);
    visible = signal(false);
    isLoading = signal(false);
    // isLoadingForm = signal(false);
    cantReg = signal(0)
    impTotal = signal(0)
    selectedCli = signal<any[]>([])
    selectedCliInfo = signal<any[]>([])
    valueForm = signal<any[]>([])
    excelExportService = new ExcelExportService();
    listCustodia$ = new BehaviorSubject('');
    listOptions: listOptionsT = {
        filtros: [],
        sort: null,
    };
    startFilters: { field: string; condition: string; operator: string; value: string; forced: boolean }[] = []

    private angularUtilService = inject(AngularUtilService)
    private searchService = inject(SearchService)
    private apiService = inject(ApiService)
    // private settingService = inject(SettingsService)

    columns$ = this.apiService.getCols('/api/custodia/cols')
    $optionsEstadoCust = this.searchService.getEstadoCustodia();

    gridData$ = this.listCustodia$.pipe(
        debounceTime(500),
        switchMap(() => {
            return this.searchService.getListaObjetivoCustodia({ options: this.listOptions })
                .pipe(map(data => { return data }))
        })
    )

    fb = inject(FormBuilder)
    objCusEstado = { clienteId: 0, estado: 0, numFactura: 0, custodiasIds: this.fb.array([this.fb.control(0)]) }
    formCusEstado = this.fb.group({
        custodia: this.fb.array([this.fb.group({ ...this.objCusEstado })])
    })
    custodia(): FormArray {
        return this.formCusEstado.get("custodia") as FormArray
    }
    numFactura(index: number): boolean {
        const value = this.custodia().at(index).get("estado")?.value
        if (value == 3 || value == 4)
            return true
        else
            return false
    }

    async ngOnInit() {
        // const user: any = this.settingService.getUser()
        // console.log('user.GrupoActividad',user)
        // if (user.PersonalId && !user.GrupoActividad.find((elem:any) => {elem == "Administracion"}) && !user.GrupoActividad.find((elem:any) => {elem == "Liquidaciones"})) {
        //     this.startFilters = [
        //         { field:'responsable', condition: 'AND', operator: '=', value: user.PersonalId.toString(), forced:true},
        //     ]
        // }
        this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptions.enableRowDetailView = false
        this.gridOptions.editable = false
        this.gridOptions.autoEdit = true
        this.gridOptions.enableAutoSizeColumns = true
        // this.gridOptions.fullWidthRows = true
        this.gridOptions.showFooterRow = true
        this.gridOptions.createFooterRow = true
        this.gridOptions.enableCheckboxSelector = true
        this.gridOptions.rowSelectionOptions = {
            selectActiveRow: true
        }

    }

    async angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid.detail
        this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
            totalRecords(this.angularGrid, 'cliente')
            columnTotal('facturacion', this.angularGrid)
            columnTotal('cant_horas_exced', this.angularGrid)
            columnTotal('impo_horas_exced', this.angularGrid)
            columnTotal('cant_km_exced', this.angularGrid)
            columnTotal('impo_km_exced', this.angularGrid)
        })
        if (this.apiService.isMobile())
            this.angularGrid.gridService.hideColumnByIds([])
    }

    handleSelectedRowsChanged(e: any): void {
        this.rows = e.detail.args.rows
        if (e.detail.args.rows.length == 1) {
            const selrow = this.angularGrid.dataView.getItemByIdx(e.detail.args.rows[0])
            this.editCustodiaId.set(selrow.id)
            if (selrow.estado.tipo === 4)
                this.estado.set(false)
            else
                this.estado.set(true)
        } else {
            this.editCustodiaId.set(0)
            this.estado.set(true)
        }

        //Agrupar por clienteId
        let regs = this.angularGrid.dataView.getAllSelectedItems()
        let itemsByClientes: any[] = []
        let clientesIds: any[] = [] //Ids de los clientes selecionados
        let valueForm: any[] = []

        for (const reg of regs) {
            if (!reg) continue
            if (clientesIds.includes(reg.cliente.id)) {
                const index: number = clientesIds.indexOf(reg.cliente.id)
                itemsByClientes[index].total += reg?.facturacion
                itemsByClientes[index].cantReg += 1
                valueForm[index].custodiasIds.push(reg.id)
            } else {
                clientesIds.push(reg.cliente?.id)
                itemsByClientes.push({ clienteId: reg.cliente.id, clienteName: reg.cliente.fullName, cantReg: 1, total: reg.facturacion, cuit: 0, razonSocial: '', domicilio: '' })
                valueForm.push({ clienteId: reg.cliente.id, estado: 0, numFactura: 0, custodiasIds: [reg.id] })
            }
        }
        this.selectedCli.set(clientesIds)
        this.selectedCliInfo.set(itemsByClientes)
        this.valueForm.set(valueForm)
    }

    getGridData(): void {
        this.listCustodia('')
    }

    listOptionsChange(options: any) {
        this.listOptions = options;
        this.listCustodia('')
    }

    setEdit(value: boolean): void {
        this.edit.set(value)
    }

    setVisible(value: boolean): void {
        this.visible.set(value)
    }

    listCustodia(event: any) {
        this.listCustodia$.next(event);
    }

    async setFormCusEstado() {
        this.custodia().clear()
        let createForm = JSON.parse(JSON.stringify(this.valueForm()))
        for (const obj of createForm) {
            let ids: FormArray = this.fb.array([])
            for (const id of obj.custodiasIds) {
                ids.push(this.fb.control(id))
            }
            obj.custodiasIds = ids

            this.custodia().push(this.fb.group(obj))
        };
        try {
            const res = await firstValueFrom(this.searchService.getDatosFacturacionByCliente(this.selectedCli()))
            let clientes = this.selectedCliInfo()
            clientes.map((obj: any, index: number) => {
                obj.cuit = res[index].CUIT
                obj.razonSocial = res[index].ApellidoNombre
                obj.domicilio = res[index].Domicilio
                return obj
            })
            this.selectedCliInfo.set(clientes)
        } catch (error) {

        }
        this.setVisible(true)
    }

    async save() {
        this.isLoading.set(true)
        this.editCustodiaId.set(0)
        try {
            let values = this.custodia().value
            // console.log(values);
            await firstValueFrom(this.apiService.setEstado(values))
            this.listCustodia('')
            let aux = this.editCustodiaId()
            await this.editCustodiaId.set(0)
            this.editCustodiaId.set(aux)
            const selrow = this.angularGrid.dataView.getAllSelectedFilteredIds()
            if (selrow.length == 1) {
                this.editCustodiaId.set(selrow[0])
            }
            this.formCusEstado.markAsUntouched()
            this.formCusEstado.markAsPristine()
        } catch (e) {

        }
        this.isLoading.set(false)
    }
}