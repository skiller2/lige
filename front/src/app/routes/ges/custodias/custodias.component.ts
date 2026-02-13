import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, computed } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { CustodiaFormComponent } from "../custodias-form/custodias-form.component";
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { FormBuilder, FormArray } from '@angular/forms';
import { CustodiasPersonalDetalleComponent } from "../../../shared/custodias-personal-detalle/custodias-personal-detalle.component";
import { Selections } from 'src/app/shared/schemas/filtro';

@Component({
    selector: 'app-custodias',
    templateUrl: './custodias.component.html',
    styleUrls: ['./custodias.component.less'],
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule,
        FiltroBuilderComponent, CustodiaFormComponent,
        CustodiasPersonalDetalleComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustodiaComponent {
    public router = inject(Router);
    public route = inject(ActivatedRoute);

    angularGrid!: AngularGridInstance;
    gridOptions!: GridOption;
    gridData: any;
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
    periodo = signal(new Date())
    anio = computed(() => this.periodo()?.getFullYear())
    mes = computed(() => this.periodo()?.getMonth()+1)
    selectedCli = signal<any[]>([])
    selectedCliInfo = signal<any[]>([])
    valueForm = signal<any[]>([])
    excelExportService = new ExcelExportService();
    listCustodia$ = new BehaviorSubject('');
    listOptions: listOptionsT = {
        filtros: [],
        sort: null,
    };
    startFilters = signal<Selections[]>([])

    private angularUtilService = inject(AngularUtilService)
    private searchService = inject(SearchService)
    private apiService = inject(ApiService)
    private settingsService = inject(SettingsService)
    private injector = inject(Injector)

    childAlta = viewChild.required<CustodiaFormComponent>('custodiaFormAlta')
    childDetalle = viewChild.required<CustodiaFormComponent>('custodiaFormDetalle')
    childEditar = viewChild.required<CustodiaFormComponent>('custodiaFormEditar')

    columns$ = this.apiService.getCols('/api/custodia/cols')
    $optionsEstadoCust = this.searchService.getEstadoCustodia();

    gridData$ = this.listCustodia$.pipe(
        debounceTime(500),
        switchMap(() => {
            return this.apiService.getListaObjetivoCustodia(this.listOptions, this.periodo())
                .pipe(map(data => { return data }))
        })
    )

    fb = inject(FormBuilder)
    objCusEstado = { clienteId: 0, estado: null, numFactura: 0, custodiasIds: this.fb.array([this.fb.control(0)]) }
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

    // selectedPeriod = computed(() => {
    //     if (this.periodo()) {
    //         this.getGridData()
    //     }
    // })

    async ngOnInit() {

        this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptions.enableRowDetailView = false
        this.gridOptions.enableAutoSizeColumns = true
        // this.gridOptions.fullWidthRows = true
        this.gridOptions.showFooterRow = true
        this.gridOptions.createFooterRow = true
        this.gridOptions.enableCheckboxSelector = true
        this.gridOptions.rowSelectionOptions = {
            selectActiveRow: true
        }



        effect(async () => {
            // console.log('PERIODO',this.periodo());
            const periodo = this.periodo() //para que triggee
            if(periodo){
                localStorage.setItem('anio',String(this.anio()))
                localStorage.setItem('mes',String(this.mes()))
            }
            this.listCustodia('')
        }, { injector: this.injector });

        const now = new Date()
        const anio =
            Number(localStorage.getItem('anio')) > 0
                ? Number(localStorage.getItem('anio'))
                : now.getFullYear();
        const mes =
            Number(localStorage.getItem('mes')) > 0
                ? Number(localStorage.getItem('mes'))
                : now.getMonth() + 1;

        this.periodo.set(new Date(anio, mes - 1, 1));

        this.settingsService.setLayout('collapsed', true)

    }

    async angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid.detail
        this.gridData = angularGrid.dataView
        this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
            totalRecords(this.angularGrid, 'cliente')
            columnTotal('facturacion', this.angularGrid)
            columnTotal('cant_horas_exced', this.angularGrid)
            columnTotal('impo_horas_exced', this.angularGrid)
            columnTotal('cant_km_exced', this.angularGrid)
            columnTotal('impo_km_exced', this.angularGrid)
            columnTotal('cant_modulos', this.angularGrid)
            columnTotal('impo_peaje', this.angularGrid)
            
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
                valueForm.push({ clienteId: reg.cliente.id, estado: null, numFactura: 0, custodiasIds: [reg.id] })
            }
        }
        this.selectedCli.set(clientesIds)
        this.selectedCliInfo.set(itemsByClientes)
        this.valueForm.set(valueForm)
        if (this.formCusEstado.dirty) {
            this.formCusEstado.markAsUntouched()
            this.formCusEstado.markAsPristine()
        }
    }

    listOptionsChange(options: any) {
        this.listOptions = options;
        this.listCustodia('')
    }

    setEdit(value: boolean): void {
        this.edit.set(value)
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
        let aux = this.editCustodiaId()
        this.editCustodiaId.update(a => 0)
        try {
            let values = this.custodia().value
            // console.log(values);
            await firstValueFrom(this.apiService.setEstado(values))
            this.listCustodia('')
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

    setVisible(value: boolean): void {
        this.visible.set(value)
    }

    onTabsetChange(_event: any) {
        console.log("_event.index ", _event.index)
        switch (_event.index) {
          case 2: //EDIT
            this.childDetalle().load()
            break;
          case 3: //ALTA
            this.childAlta().reset()
            break;
          case 4: //Editar
            this.childEditar().load()
            break;
            default:
            break;
        }
    
    }

    ngAfterViewInit(): void {
    
        const ClienteId = Number(this.route.snapshot.paramMap.get('ClienteId'))
    
        setTimeout(() => {
          if (ClienteId > 0) {
            this.startFilters.set([ {index:'ClienteId', condition:'AND', operator:'=', value: String(ClienteId), closeable: true}])
          }
        }, 1000)
      }
    

}