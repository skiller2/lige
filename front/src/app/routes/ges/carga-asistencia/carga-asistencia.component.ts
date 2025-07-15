import { CommonModule } from '@angular/common';
import { Component, ViewChild, ViewEncapsulation, inject, signal } from '@angular/core';
import { AbstractControl, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ExcelExportOption, SlickGroup } from '@slickgrid-universal/common';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, Aggregators } from 'angular-slickgrid';
import { BehaviorSubject, Observable, debounceTime, firstValueFrom, forkJoin, map, pairwise, startWith, switchMap, tap, timer } from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { SHARED_IMPORTS } from '@shared';
import { CustomInputEditor } from '../../../shared/custom-grid-editor/custom-grid-editor.component';
import { EditorPersonaComponent } from '../../../shared/editor-persona/editor-persona.component';
import { SearchService } from 'src/app/services/search.service';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { SettingsService } from '@delon/theme';
import { EditorTipoHoraComponent } from 'src/app/shared/editor-tipohora/editor-tipohora.component';
import { EditorCategoriaComponent } from 'src/app/shared/editor-categoria/editor-categoria.component';
import { LoadingService } from '@delon/abc/loading';
import { columnTotal, totalRecords } from 'src/app/shared/custom-search/custom-search';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { ViewResponsableComponent } from "../../../shared/view-responsable/view-responsable.component";
import { CustomFloatEditor } from 'src/app/shared/custom-float-grid-editor/custom-float-grid-editor.component';

enum Busqueda {
    Sucursal,
    Objetivo,
    Personal,
    Responsable,
    Periodo
}

@Component({
    selector: 'app-carga-asistencia',
    templateUrl: './carga-asistencia.component.html',
    styleUrls: ['./carga-asistencia.component.less'],
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [...SHARED_IMPORTS, CommonModule, ObjetivoSearchComponent, DetallePersonaComponent, ViewResponsableComponent]
})
export class CargaAsistenciaComponent {
    @ViewChild('carasistForm', { static: true }) carasistForm: NgForm =
        new NgForm([], []);
    peridoDesde: any;
    peridoHasta: any;

    private readonly loadingSrv = inject(LoadingService);
    private readonly route = inject(ActivatedRoute);
    public apiService = inject(ApiService)
    public router = inject(Router)
    private angularUtilService = inject(AngularUtilService)
    private searchService = inject(SearchService)
    private settingsService = inject(SettingsService)
    private formPrevVals: any = {}
    columnDefinitions: Column[] = [];
    columnas: Column[] = [];
    gridOptionsEdit!: GridOption;
    gridDataInsert: any[] = [];

    excelExportService = new ExcelExportService()
    excelExportOption!: ExcelExportOption;
    angularGridEdit!: AngularGridInstance;
    detailViewRowCount = 1;
    selectedPeriod = { year: 0, month: 0 };
    selectedSucursalId = 0
    selectedPersonalId = 0
    objetivoData: any
    ObjetivoIdUrl: any
    periodos: any
    contratos: any[] = []
    controlAccesoDisabled = signal(false)
    visibleDrawer: boolean = false
    personalApellidoNombre: any;
    rowLocked: boolean = false;
    objetivoInfo: any = {}
    diffHoras = signal(0)

    public get Busqueda() {
        return Busqueda;
    }
    selectedObjetivoId: number = 0
    $isObjetivoDataLoading = new BehaviorSubject(false);
    $selectedObjetivoIdChange = new BehaviorSubject(0);
    $formChange = new BehaviorSubject({});
    objetivoResponsablesLoading$ = new BehaviorSubject<boolean | null>(null);
    isLoadingCheck = false;
    customHeaderExcel: any[] = []

    getHorasNormales(data: any) {
        const totalHorasN = data.map((row: { forma: { id: string; }; total: any; }) => { return (row.forma.id == 'N') ? row.total : 0 }).reduce((prev: number, curr: number) => prev + curr, 0)
        this.carasistForm.form.patchValue({ TotalHorasReales: Number(totalHorasN) }, { emitEvent: false })

        const values = this.carasistForm.form.getRawValue()

        this.diffHoras.set(Number(values.TotalHoraA) + Number(values.TotalHoraB) - totalHorasN)
    }



    getObjetivoDetalle(objetivoId: number, anio: number, mes: number): Observable<any> {
        this.loadingSrv.open({ type: 'spin', text: '' })
        return forkJoin([
            this.searchService.getObjetivoResponsables(objetivoId, anio, mes),
            this.searchService.getObjetivoContratos(objetivoId, anio, mes),
            this.searchService.getAsistenciaPeriodo(objetivoId, anio, mes),
            // Carga detalle de diario.
            this.searchService.getListaAsistenciaPersonalAsignado(objetivoId, anio, mes)
        ]).pipe(
            map((data: any[]) => {
                this.gridOptionsEdit.params.SucursalId = this.selectedSucursalId
                this.excelExportOption.filename = `${this.selectedPeriod.year}-${this.selectedPeriod.month}-${data[2][0]?.ObjetivoCodigo}-${data[1][0]?.ClienteDenominacion}-${data[2][0]?.ClienteElementoDependienteDescripcion}`
                this.customHeaderExcel = [[{ value: `Año: ${anio}` }],
                [{ value: `Mes: ${mes}` }],
                [{ value: `Cliente: ${data[1][0]?.ClienteDenominacion} ` }],
                [{ value: `Código Objetivo: ${data[2][0]?.ObjetivoCodigo}` }],
                [{ value: `Objetivo: ${data[2][0]?.ClienteElementoDependienteDescripcion}` }],
                [{ value: `Grupo Actividad: ${data[0][0]?.detalle}` }],
                []]

                this.angularGridEdit.resizerService.resizeGrid();

                if (data[3].length) {
                    this.angularGridEdit.dataView.setItems(data[3])
                    this.gridDataInsert = this.angularGridEdit.dataView.getItems()
                    this.addNewItem("bottom")
                } else {
                    this.clearAngularGrid()
                }

                this.periodos = data[2]
                this.contratos = data[1]
                this.gridOptionsEdit.editable = (data[2][0]?.ObjetivoAsistenciaAnoMesDesde != null && data[2][0]?.ObjetivoAsistenciaAnoMesHasta == null && this.contratos.length > 0)

                this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)

                this.angularGridEdit.slickGrid.invalidate();
                this.angularGridEdit.slickGrid.render();
                this.angularGridEdit.slickGrid.setOptions(this.gridOptionsEdit);

                //this.gridDataInsert = data[3]
                //data[3].length? this.gridDataInsert = data[3] : this.clearAngularGrid()
                    
                for (const col of this.angularGridEdit.slickGrid.getColumns())
                    if (String(col.id).indexOf('day') != -1) columnTotal(String(col.id), this.angularGridEdit)

                totalRecords(this.angularGridEdit, 'apellidoNombre')
                columnTotal('total', this.angularGridEdit)
                this.getHorasNormales(this.gridDataInsert)
                this.carasistForm.form.patchValue({ TotalHoraA: data[2][0]?.TotalHoraA, TotalHoraB: data[2][0]?.TotalHoraB }, { emitEvent: false })
                this.carasistForm.form.markAsPristine()
                this.formPrevVals = this.carasistForm.form.value

                const values = this.carasistForm.form.getRawValue()

                
                this.diffHoras.set(Number(values.TotalHoraA) + Number(values.TotalHoraB) - Number(values.TotalHorasReales))


                //this.carasistForm.form.get('ImporteHora')?.markAsPristine()
                //this.carasistForm.form.get('ImporteFijo')?.markAsPristine()
                //this.carasistForm.form.get('TotalHoras')?.markAsPristine()

                this.loadingSrv.close()
                return { responsable: data[0], contratos: data[1], periodo: data[2] };
            })
        );
    }

    $objetivoDetalle = this.$selectedObjetivoIdChange.pipe(
        debounceTime(50),
        switchMap(objetivoId => {
            return this.getObjetivoDetalle(objetivoId, this.selectedPeriod.year, this.selectedPeriod.month)
                .pipe(
                    //                  switchMap((data:any) => { return data}),
                    doOnSubscribe(() => this.objetivoResponsablesLoading$.next(true)),
                    tap({
                        complete: () => { this.objetivoResponsablesLoading$.next(false) },
                    })
                );
        })
    );

    sumdays(row: any) {
        let sum = 0
        for (const day in row) {
            if (day.indexOf('day') != -1)
                sum += Number(row[day])
        }
        return sum
    }

    async ngOnInit() {
        this.columnDefinitions = [
            {
                id: 'apellidoNombre', name: 'Persona', field: 'apellidoNombre',
                sortable: true,
                type: FieldType.string,
                maxWidth: 250,
                minWidth: 170,
                formatter: Formatters['complexObject'],
                exportWithFormatter: true,
                params: {
                    complexFieldLabel: 'apellidoNombre.fullName',
                },
                excelExportOptions: {
                    autoDetectCellFormat: true,
                    width: 55,
                },
                editor: {
                    model: CustomInputEditor,
                    collection: [],
                    params: {
                        component: EditorPersonaComponent,
                    },
                    alwaysSaveOnEnterKey: true,
                    // required: true
                },
            },
            {
                id: 'forma', name: 'Forma', field: 'forma',
                sortable: true,
                type: FieldType.object,
                maxWidth: 50,
                minWidth: 50,
                formatter: Formatters['complexObject'],
                params: {
                    complexFieldLabel: 'forma.fullName',
                    complexField: 'forma.fullName',
                },
                exportWithFormatter: true,

                editor: {
                    model: CustomInputEditor,
                    collection: [],
                    params: {
                        component: EditorTipoHoraComponent,
                    },
                    alwaysSaveOnEnterKey: true,
                    // required: true
                },
                excelExportOptions: {
                    width: 10,
                },
            },
            {
                id: 'categoria', name: 'Categoria', field: 'categoria',
                sortable: true,
                type: FieldType.string,
                maxWidth: 100,
                minWidth: 100,
                formatter: Formatters['complexObject'],
                params: {
                    complexFieldLabel: 'categoria.fullName',
                },
                exportWithFormatter: true,
                editor: {
                    model: CustomInputEditor,
                    collection: [],
                    params: {
                        component: EditorCategoriaComponent,
                        //                        anio: this.getPeriodo().year,
                        //                        mes: this.getPeriodo().month,
                    },
                    alwaysSaveOnEnterKey: true,
                    // required: true
                },
                // onCellChange: this.categoryChange.bind(this),
                excelExportOptions: {
                    width: 14,
                },
            },
            /*{
                id: 'dbid', name: 'dbid', field: 'dbid',
            }*/
        ]

        this.columnas = this.columnDefinitions
        this.excelExportOption = {
            filename: `${this.selectedPeriod.year}/${this.selectedPeriod.month}/${this.selectedObjetivoId}`,
            columnHeaderStyle: {
                alignment: { horizontal: 'center' },
                font: { color: 'black', size: 10, bold: true },
                fill: { type: 'pattern', patternType: 'solid', fgColor: '6A9BCC' },
            },
            exportWithFormatter: true
        }
        this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.grid-container-asis', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptionsEdit.enableRowDetailView = false
        this.gridOptionsEdit.autoEdit = true

        this.gridOptionsEdit.enableAutoSizeColumns = true
        this.gridOptionsEdit.fullWidthRows = true

        this.gridOptionsEdit.showFooterRow = true
        this.gridOptionsEdit.createFooterRow = true

        this.gridOptionsEdit.enableExcelExport = false

        this.gridOptionsEdit.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {
            //            let undoCommandArr:EditCommand[]=[]
            this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)
            this.angularGridEdit.slickGrid.invalidate();

            const emptyrows = this.angularGridEdit.dataView.getItems().filter(row => (!row.apellidoNombre.id))

            if (emptyrows.length == 0) {
                this.addNewItem("bottom")
            } else if (emptyrows.length > 1) {
                this.angularGridEdit.gridService.deleteItemById(emptyrows[0].id)
            }
            //Intento grabar si tiene error hago undo

            try {
                //                undoCommandArr.push(editCommand)
                if (column.type == FieldType.number || column.type == FieldType.float)
                    editCommand.serializedValue = Number(editCommand.serializedValue)

                if (JSON.stringify(editCommand.serializedValue) === JSON.stringify(editCommand.prevSerializedValue)) return
                //                editCommand.serializedValue == editCommand.prevSerializedValue) return
                editCommand.execute()
                while (this.rowLocked) await firstValueFrom(timer(500));
                row = this.angularGridEdit.dataView.getItemById(row.id)

                const totalhs = this.sumdays(row)

                if ((row.apellidoNombre.id > 0 && row.categoria.id != '' && row.forma.id != '' && row.dbid > 0) ||
                    (totalhs > 0)) {
                    if (!row.dbid)
                        this.rowLocked = true

                    const response: any = await this.insertDB(row)
                    if (response.deleteRowId)
                        this.angularGridEdit.gridService.deleteItemById(response.deleteRowId)
                    else if (response.categoria || response.forma || response.newRowId) {
                        const item = this.angularGridEdit.dataView.getItemById(row.id)
                        item.categoria = response.categoria ? response.categoria : item.categoria
                        item.forma = response.forma ? response.forma : item.forma
                        item.dbid = response.newRowId ? response.newRowId : item.dbid
                        this.angularGridEdit.gridService.updateItemById(row.id, item)

                    }
                    this.rowLocked = false
                }

            } catch (e: any) {
                let item = this.angularGridEdit.dataView.getItemById(row.id)
                if (e.error.data.categoria || e.error.data.forma) {
                    item.categoria = e.error.data.categoria ? e.error.data.categoria : row.categoria
                    item.forma = e.error.data.forma ? e.error.data.forma : row.forma
                } else if (editCommand && SlickGlobalEditorLock.cancelCurrentEdit()) {
                    const fld = editCommand.editor.args.column.field
                    if (!e.error.data.keepvalue || item[fld] != '') {
                        editCommand.undo();
                        item[fld] = editCommand.editor.args.item[fld]
                    }
                }
                this.angularGridEdit.gridService.updateItemById(row.id, item)

                this.rowLocked = false
            }
        }
    }

    ngAfterViewInit(): void {
        const now = new Date(); //date
        setTimeout(() => {
            const anio =
                Number(localStorage.getItem('anio')) > 0
                    ? Number(localStorage.getItem('anio'))
                    : now.getFullYear();
            const mes =
                Number(localStorage.getItem('mes')) > 0
                    ? Number(localStorage.getItem('mes'))
                    : now.getMonth() + 1;

            this.carasistForm.form.get('periodo')?.setValue(new Date(anio, mes - 1, 1))
        }, 1);
        this.settingsService.setLayout('collapsed', true)
        const ObjetivoId = Number(this.route.snapshot.params['ObjetivoId']);

        setTimeout(() => {
            if (ObjetivoId > 0)
                this.carasistForm.controls['ObjetivoId'].setValue(ObjetivoId);
        }, 1000)


    }

    onCellChanged(e: any) {
    }

    async angularGridReadyEdit(angularGrid: any) {
        this.angularGridEdit = angularGrid.detail
        //this.gridObjEdit = angularGrid.detail.slickGrid;

        setTimeout(() => {
            if (this.gridDataInsert.length == 0)
                this.addNewItem("bottom")

        }, 500);

        if (this.apiService.isMobile())
            this.angularGridEdit.gridService.hideColumnByIds([])

        const x = this

        this.angularGridEdit.slickGrid.onCellChange.subscribe(function (e, args) {

            setTimeout(() => { //Fix par que lea el valor correcto
                const item = args.item
                const keysDays = Object.keys(item).filter(key => key.startsWith("day"))
                const total = keysDays.reduce((acc, key) => {
                    const value = parseFloat(item[key]);
                    return isNaN(value) ? acc : acc + value;
                }, 0)

                const idItemGrid = args.item.id
                const updateItem = {
                    ...args.item,
                    total: total
                }

                x.angularGridEdit.gridService.updateItemById(idItemGrid, updateItem)
                x.updateTotals(String(args.column.id), x.angularGridEdit)

            }, 0);
        });

    }

    updateTotals(columnId: string, angularGrid: AngularGridInstance) {
        if (columnId.indexOf('day') != -1) columnTotal(columnId, angularGrid)
        totalRecords(angularGrid, 'apellidoNombre')
        columnTotal('total', angularGrid)
        this.getHorasNormales(angularGrid.dataView.getItems())
    }

    sumTotalsFormatterCustom(totals: any, columnDef: any) {

        const val = totals.sum && totals.sum[columnDef.field]
        if (val != null && totals.group.count > 1) {
            return val
        }

        return '';

    }

    addNewItem(insertPosition?: 'bottom') {
        const newItem1 = this.createNewItem(1);
        this.angularGridEdit.gridService.addItem(newItem1, { position: insertPosition, highlightRow: false, scrollRowIntoView: false, triggerEvent: false });
    }

    createNewItem(incrementIdByHowMany = 1) {
        const dataset = this.angularGridEdit.dataView.getItems();
        let highestId = 0;
        dataset.forEach((item: any) => {
            if (item.id > highestId) {
                highestId = item.id;
            }
        });
        const newId = highestId + incrementIdByHowMany;
        return {
            id: newId,
            apellidoNombre: '',
            forma: '',
            //            tipo: '',
            categoria: '',
        };
    }

    getDaysOfWeekOfMonth(year: number, month: number): Column[] {
        let columnDays: Column[] = []
        const daysInMonth = new Date(year, month, 0).getDate();
        const daysOfWeek = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
        for (let index = 1; index <= daysInMonth; index++) {
            let date = new Date(year, month - 1, index);
            const dow = date.getDay()
            let name = daysOfWeek[dow];
            const col:Column = {
                id: `day${index}`,
                name: `${name} <BR>${index}`,
                field: `day${index}`,
                sortable: true,
                type: FieldType.float,
                formatter: Formatters['decimal'],
                params : { maxDecimal:1,minDecimal:0  },
                maxWidth: 55,
                headerCssClass: (dow == 6 || dow == 0) ? 'grid-weekend' : '',
                //                formatter : Formatters.multiple,
                //                params: {
                //                    formatters: [Formatters.currency],
                //                },
                cssClass: 'text-right',
                editor: { model: CustomFloatEditor, decimal: 1,params:{} },
                excelExportOptions: {
                    width: 5,
                },
                groupTotalsFormatter: this.sumTotalsFormatterCustom,
                groupTotalsExcelExportOptions: {
                    style: {
                        font: { bold: true },
                        alignment: { horizontal: 'center' },
                    },
                },
                // exportWithFormatter: true,
            }
            columnDays.push(col);
        }

        columnDays.push({
            id: `total`,
            name: `Total`,
            field: 'total',
            sortable: true,
            type: FieldType.float,
            maxWidth: 50,
            minWidth: 50,
            formatter: Formatters['decimal'],
            cssClass: 'text-right',
            excelExportOptions: {
                style: {
                    font: { bold: true },
                    fill: { type: 'pattern', patternType: 'solid', fgColor: 'ffd5d5d5', }
                },
                width: 6,
            },
            groupTotalsFormatter: this.sumTotalsFormatterCustom,
            groupTotalsExcelExportOptions: {
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'center' },
                },
            },
            // exportWithFormatter: true,
        });

        return columnDays
    }

    async formChange(result: Date | String, busqueda: Busqueda): Promise<void> {
        switch (busqueda) {
            case Busqueda.Periodo:
                this.selectedPeriod.year = (result as Date).getFullYear();
                this.selectedPeriod.month = (result as Date).getMonth() + 1;
                localStorage.setItem('anio', String(this.selectedPeriod.year));
                localStorage.setItem('mes', String(this.selectedPeriod.month));

                const daysOfMonth = this.getDaysOfWeekOfMonth(this.selectedPeriod.year, this.selectedPeriod.month);
                this.columnas = [...this.columnDefinitions, ...daysOfMonth];
                break;
            case Busqueda.Objetivo:
                if (this.selectedObjetivoId > 0) {
                    this.router.navigate(['.', { ObjetivoId: this.selectedObjetivoId }], {
                        relativeTo: this.route,
                        skipLocationChange: false,
                        replaceUrl: false,
                    })
                    this.selectedSucursalId = this.objetivoInfo?.SucursalId
                }

                //                this.router.navigateByUrl('/ges/carga_asistencia', { skipLocationChange: true, state: { 'ObjetivoId': '1' } })
                //                this.router.navigate([],{relativeTo: this.route, skipLocationChange: true})
                break;

            default:
                break;
        }

        this.$selectedObjetivoIdChange.next(this.selectedObjetivoId);
        this.$isObjetivoDataLoading.next(true);


        this.angularGridEdit.slickGrid.setOptions({ frozenColumn: 2 })
        this.angularGridEdit.slickGrid.reRenderColumns(true)
        this.gridOptionsEdit.params.anio = this.selectedPeriod.year
        this.gridOptionsEdit.params.mes = this.selectedPeriod.month
        this.gridOptionsEdit.params.ObjetivoId = this.selectedObjetivoId
        this.gridOptionsEdit.params.SucursalId = this.selectedSucursalId

        this.angularGridEdit.slickGrid.setOptions(this.gridOptionsEdit);


        this.clearAngularGrid()
    }

    clearAngularGrid(): void {
        const items = this.angularGridEdit.dataView.getItems()
        const itemsId = items.map(item => {
            return item.id
        })
        this.angularGridEdit.dataView.deleteItems(itemsId)
        this.addNewItem("bottom")
    }


    editColumnSelectOptions(column: string, array: Object[], campo: string, columns: any) {
        const idColumn = this.angularGridEdit.slickGrid.getColumnIndex(column)
        const newOptions: any = array.map((cate: any) => {
            return cate[campo]
        })
        let options = columns[idColumn].internalColumnEditor?.collection || []
        options = [...new Set(options.concat(newOptions))]
        columns[idColumn].internalColumnEditor = {
            ...columns[idColumn].internalColumnEditor,
            collection: options
        }

    }

    async insertDB(item: any) {
        if (this.selectedObjetivoId) {
            let { apellidoNombre, categoria, forma, ...row } = item
            const outItem = {
                ...row,
                ...this.selectedPeriod,
                objetivoId: this.selectedObjetivoId,
                personalId: apellidoNombre.id,
                tipoAsociadoId: categoria.tipoId,
                categoriaPersonalId: categoria.categoriaId,
                formaLiquidacion: forma.id,
            }
            return firstValueFrom(this.apiService.addAsistencia(outItem))
        }
    }

    async endCargaAsistencia() {
        this.isLoadingCheck = true
        const editable = this.angularGridEdit.slickGrid.getOptions().editable
        if (editable)
            this.angularGridEdit.slickGrid.setOptions({ editable: false })

        try {
            await this.setValFact(null)
            const res = await firstValueFrom(this.apiService.endAsistenciaPeriodo(this.selectedPeriod.year, this.selectedPeriod.month, this.selectedObjetivoId)).
                finally(() => { this.isLoadingCheck = false })
            this.$selectedObjetivoIdChange.next(this.selectedObjetivoId)
        } catch (error) {

        }
        if (editable)
            this.angularGridEdit.slickGrid.setOptions({ editable: true })

    }

    async validaGrilla() {
        this.isLoadingCheck = true


        const editable = this.angularGridEdit.slickGrid.getOptions().editable
        if (editable)
            this.angularGridEdit.slickGrid.setOptions({ editable: false })

        try {
            const res = firstValueFrom(this.apiService.validaGrilla(this.selectedPeriod.year, this.selectedPeriod.month, this.selectedObjetivoId)).
                finally(() => { this.isLoadingCheck = false })
        } catch (error) {

        }

        if (editable)
            this.angularGridEdit.slickGrid.setOptions({ editable: true })

    }

    async setCargaAsistencia() {
        try {
            await firstValueFrom(this.apiService.addAsistenciaPeriodo(this.selectedPeriod.year, this.selectedPeriod.month, this.selectedObjetivoId))
        } catch (_e) { }
        this.$selectedObjetivoIdChange.next(this.selectedObjetivoId)
    }
    async setValFact(e: any) {
        if (!this.carasistForm.form.get('TotalHoraB')?.pristine || !this.carasistForm.form.get('TotalHoraA')?.pristine) {
            try {
                await firstValueFrom(this.apiService.setHorasFacturacion(this.selectedPeriod.year, this.selectedPeriod.month, this.selectedObjetivoId, this.carasistForm.form.get('TotalHoraA')?.value,this.carasistForm.form.get('TotalHoraB')?.value))
                this.formPrevVals = this.carasistForm.form.value
            } catch (_e) {
                this.carasistForm.form.get('TotalHoraA')?.setValue(this.formPrevVals.TotalHoraA)
                this.carasistForm.form.get('TotalHoraB')?.setValue(this.formPrevVals.TotalHoraA)
            }
            this.carasistForm.form.get('TotalHoraA')?.markAsPristine()
            this.carasistForm.form.get('TotalHoraB')?.markAsPristine()
    
            const values = this.carasistForm.form.getRawValue()
            this.diffHoras.set(Number(values.TotalHoraA) + Number(values.TotalHoraB) - values.TotalHorasReales)
        }

    }

    collapseChange($event: any) {
        setTimeout(() => {
            this.angularGridEdit.resizerService.resizeGrid();

        }, 500);
    }

    updateItemMetadata(previousItemMetadata: any) {
        return (rowNumber: number) => {
            const item = this.angularGridEdit.dataView.getItem(rowNumber)
            let meta = { cssClasses: '' }

            if (typeof previousItemMetadata === 'object')
                meta = previousItemMetadata(rowNumber)

            if (item.categoria?.horasRecomendadas > 0)
                meta.cssClasses = 'app-horas-fijas'
            else
                meta.cssClasses = ''
            return meta
        }
    }

    openDrawer(): void {
        const selrows = this.angularGridEdit.slickGrid.getSelectedRows()
        if (selrows[0] == undefined) return
        const row = this.angularGridEdit.slickGrid.getDataItem(selrows[0])
        if (row.apellidoNombre == '') return

        this.personalApellidoNombre = row.apellidoNombre.fullName
        this.selectedPersonalId = row.apellidoNombre.id
        this.visibleDrawer = true
    }

    getPersonalIdFromGrid(): number {
        const selrows = this.angularGridEdit.slickGrid.getSelectedRows()
        if (selrows[0] == undefined) return 0
        const row = this.angularGridEdit.slickGrid.getDataItem(selrows[0])
        if (row.apellidoNombre == '') return 0
        return row.apellidoNombre.id
    }

    closeDrawer(): void {
        this.visibleDrawer = false;
    }

    async autocomplete() {
        if (this.selectedPeriod.month && this.selectedSucursalId) {
            const objetivoId = this.selectedObjetivoId
            const anio = this.selectedPeriod.year
            const mes = this.selectedPeriod.month

            const list: any = await firstValueFrom(this.searchService.getListaAsistenciaPersonalAsignadoAnterior(objetivoId, anio, mes))
            if (list.length) {
                this.angularGridEdit.dataView.setItems(list)
                this.gridDataInsert = this.angularGridEdit.dataView.getItems()
                this.addNewItem("bottom")
            }

        }
    }

    async leerControlAcceso() {
        if (this.selectedPeriod.month && this.selectedSucursalId) {
            const objetivoId = this.selectedObjetivoId
            const anio = this.selectedPeriod.year
            const mes = this.selectedPeriod.month
            this.controlAccesoDisabled.set(true)
            try {
                const list: any = await firstValueFrom(this.searchService.getListaAsistenciaControAcceso(objetivoId, anio, mes))
                await this.formChange('', Busqueda.Objetivo)
            } catch (error) { }
            this.controlAccesoDisabled.set(false)

        }
    }

    async exportGrid() {
        this.groupByForma()
        await this.addCustomHeader()
        await this.excelExportService.exportToExcel();
        this.clearGrouping()
    }

    groupByForma() {
        let grandTotal: any
        const lastrow: any = this.gridDataInsert[this.gridDataInsert.length - 1];
        if (lastrow && (lastrow.apellidoNombre == '')) {
            grandTotal = this.gridDataInsert.pop()
            // this.gridDataInsert.pop()
            this.angularGridEdit.dataView.setItems(this.gridDataInsert)
            // }
        } else {
            grandTotal = this.createNewItem(1);
        }

        let aggregatorsArray: any[] = []
        this.columnas.forEach((col: any, index: number) => {
            if (col.field.startsWith('day')) {
                grandTotal[col.field] = this.angularGridEdit.slickGrid.getFooterRowColumn(col.field).innerText
                aggregatorsArray.push(new Aggregators['Sum'](col.field))
            }
            if (col.field.startsWith('total')) {
                aggregatorsArray.push(new Aggregators['Sum'](col.field))
            }
        })
        grandTotal.total = this.angularGridEdit.slickGrid.getFooterRowColumn('total').innerText
        grandTotal.forma = { fullName: 'TOTALES' }

        this.angularGridEdit.dataView.setGrouping({
            getter: (g) => g.forma.fullName,
            aggregators: aggregatorsArray,
            aggregateCollapsed: false,
            lazyTotalsCalculation: true,
        });

        this.angularGridEdit.dataView.addItem(grandTotal)
        let grupos: SlickGroup[] = this.angularGridEdit.dataView.getGroups()
        let grupototal: any = grupos.pop()
        grupototal!.title = ""
        grupos.push(grupototal)

        // let grupos: SlickGroup[] = this.angularGridEdit.dataView.getGroups()
        // if (grupos.length > 1) {
        //     this.angularGridEdit.dataView.addItem(grandTotal)
        //     grupos= this.angularGridEdit.dataView.getGroups()
        //     let grupototal: any = grupos.pop()
        //     grupototal!.title = ""
        //     grupos.push(grupototal)
        // }

    }

    clearGrouping() {
        this.gridDataInsert.pop()
        this.angularGridEdit.dataView.setGrouping([]);
        const lastrow: any = this.gridDataInsert[this.gridDataInsert.length - 1];
        if (lastrow && (lastrow.apellidoNombre != '')) {
            this.addNewItem("bottom")
        }
    }
    addCustomHeader() {
        let totalHeader: any[] = []
        let totalHoras = 0
        const cantCeldas = 4
        const columnaInicial = 'E'
        const fila = 5
        //Cantidad de celdas que se van a fusionadar
        let arrayRango: any[] = []
        for (let index = 0; index < cantCeldas; index++) {
            arrayRango.push({ value: '' })
        }

        //Crear el encabezado del Excel
        this.excelExportOption.customExcelHeader = (workbook, sheet) => {
            const stylesheet = workbook.getStyleSheet();

            const aFormatDefn = {
                font: { 'size': 12, 'fontName': 'Calibri', 'bold': true },
                fill: {
                    type: 'pattern' as const,
                    patternType: 'solid',
                    fgColor: 'FF7AB573',
                },
                alignment: {
                    horizontal: 'center' as const, // Forzar el tipo a "center"
                },
            };
            const bFormatDefn = { font: { bold: true }, }
            const titleId = stylesheet.createFormat(aFormatDefn);
            const totalId = stylesheet.createFormat(bFormatDefn);
            //Armar los totales de horas
            let grupos: any[] = this.angularGridEdit.dataView.getGroups()
            grupos.forEach((obj, index, arr) => {
                if (obj.value != "TOTALES") {
                    totalHoras += obj.totals.sum.total
                    totalHeader = totalHeader.concat([{ value: `Horas ${obj.value}:`, metadata: { style: titleId.id } }, ...arrayRango, { value: obj.totals.sum.total, metadata: { style: totalId.id } }, { value: '' }])
                    delete arr[index].totals.sum.total
                }
            })
            totalHeader = totalHeader.concat([{ value: `Total de Horas:`, metadata: { style: titleId.id } }, ...arrayRango, { value: totalHoras, metadata: { style: totalId.id } }])
            //Sumar a la fila del encabezado los totales de horas
            const rowNum = this.customHeaderExcel.length - 2
            let auxCustomHeaderExcel = [...this.customHeaderExcel]
            auxCustomHeaderExcel[rowNum] = this.customHeaderExcel[rowNum].concat({ value: '' }, { value: '' }, { value: '' }, totalHeader)

            //
            sheet.mergeCells('A1', 'B1');
            sheet.mergeCells('A2', 'B2');
            sheet.mergeCells('A3', 'B3');
            sheet.mergeCells('A4', 'B4');
            sheet.mergeCells('A5', 'B5');

            let colA = columnaInicial
            let colB = columnaInicial
            for (let index = 0; index < grupos.length; index++) {
                colB = this.saltarLetra(colA, cantCeldas)
                sheet.mergeCells(`${colA}${fila}`, `${colB}${fila}`);
                colA = this.saltarLetra(colB, 3)
            }

            sheet.setRowInstructions(4, { height: 20 })
            sheet.data = auxCustomHeaderExcel;

        }
        this.gridOptionsEdit.excelExportOptions = this.excelExportOption;

        this.angularGridEdit.slickGrid.setOptions(this.gridOptionsEdit);
    }

    saltarLetra(entrada: string, salto: number) {
        const base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        let result = ''
        let carry = 0
        for (let i = entrada.length - 1; i >= 0; i--) {
            const char = entrada[i]
            const pos = base.indexOf(char)
            let newPos = pos + carry
            if (i == entrada.length - 1)
                newPos += salto;
            if (newPos >= base.length) {
                newPos -= base.length
                carry = 1
            } else
                carry = 0
            result = base[newPos] + result
        }
        if (carry)
            result = 'A' + result
        return result
    }

}