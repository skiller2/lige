import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ExcelExportOption, SlickGroup, SortComparers, SortDirectionNumber } from '@slickgrid-universal/common';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { BehaviorSubject, Observable, debounceTime, distinctUntilChanged, firstValueFrom, forkJoin, map, merge, mergeAll, of, shareReplay, switchMap, tap } from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { SHARED_IMPORTS } from '@shared';
import { CustomInputEditor } from '../../../shared/custom-grid-editor/custom-grid-editor.component';
import { EditorPersonaComponent } from '../../../shared/editor-persona/editor-persona.component';
import { SearchService } from 'src/app/services/search.service';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { SettingsService } from '@delon/theme';
import { EditorTipoHoraComponent } from 'src/app/shared/editor-tipohora/editor-tipohora.component';
import { EditorCategoriaComponent } from 'src/app/shared/editor-categoria/editor-categoria.component';
import { LoadingService } from '@delon/abc/loading';
import { columnTotal, totalRecords } from 'src/app/shared/custom-search/custom-search';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { ViewResponsableComponent } from "../../../shared/view-responsable/view-responsable.component";
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
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [...SHARED_IMPORTS, FiltroBuilderComponent, CommonModule, PersonalSearchComponent, ObjetivoSearchComponent, DetallePersonaComponent, ViewResponsableComponent]
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


    columnDefinitions: Column[] = [];
    columnas: Column[] = [];
    gridOptionsEdit!: GridOption;
    gridDataInsert: any[] = [];

    excelExportService = new ExcelExportService()
    excelExportOption! : ExcelExportOption ;
    angularGridEdit!: AngularGridInstance;
    detailViewRowCount = 1;
    selectedPeriod = { year: 0, month: 0 };
    selectedSucursalId = 0
    selectedPersonalId = 0
    objetivoData: any
    ObjetivoIdUrl: any
    periodos: any

    visibleDrawer: boolean = false
    personalApellidoNombre: any;

    public get Busqueda() {
        return Busqueda;
    }
    selectedObjetivoId: number = 0
    $isObjetivoDataLoading = new BehaviorSubject(false);
    $selectedObjetivoIdChange = new BehaviorSubject(0);
    $formChange = new BehaviorSubject({});
    objetivoResponsablesLoading$ = new BehaviorSubject<boolean | null>(null);
    isLoading = false;

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
                // console.log('DATA',data);
                this.selectedSucursalId = data[1][0]?.SucursalId
                this.gridOptionsEdit.editable = (data[2][0]?.ObjetivoAsistenciaAnoMesDesde != null && data[2][0]?.ObjetivoAsistenciaAnoMesHasta == null)
                this.gridOptionsEdit.params.SucursalId = this.selectedSucursalId

                this.excelExportOption.filename = `${this.selectedPeriod.year}-${this.selectedPeriod.month}-${data[2][0]?.ObjetivoCodigo}-${data[2][0]?.ObjetivoDescripcion}`
                this.excelExportOption.customExcelHeader = (workbook, sheet) => {
                    sheet.setRowInstructions(4, { height: 20 })
                    sheet.data.push(
                        [{ value: `Año: ${anio}` }], 
                        [{ value: `Mes: ${mes}` }], 
                        [{ value: `Código: ${data[2][0]?.ObjetivoCodigo}` }],
                        [{ value: `Objetivo: ${data[2][0]?.ObjetivoDescripcion}` }],
                        []
                    );
                }
                this.gridOptionsEdit.excelExportOptions = this.excelExportOption;

                this.angularGridEdit.slickGrid.setOptions(this.gridOptionsEdit);
                this.angularGridEdit.resizerService.resizeGrid();

                //console.log('data[3]',data[3]);
                if (data[3].length) {
                    this.angularGridEdit.dataView.setItems(data[3])
                    this.gridDataInsert = this.angularGridEdit.dataView.getItems()
                    this.addNewItem("bottom")
                } else {
                    this.clearAngularGrid()
                }

                for (const col of this.angularGridEdit.slickGrid.getColumns())
                    if (String(col.id).indexOf('day') != -1) columnTotal(String(col.id), this.angularGridEdit)
                totalRecords(this.angularGridEdit, 'apellidoNombre')
                columnTotal('total', this.angularGridEdit)

                this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)

                this.angularGridEdit.slickGrid.invalidate();
                this.angularGridEdit.slickGrid.render();

                this.periodos = data[2]
                //this.gridDataInsert = data[3]
                //data[3].length? this.gridDataInsert = data[3] : this.clearAngularGrid()
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

    async ngOnInit() {


        this.columnDefinitions = [
            {
                id: 'apellidoNombre', name: 'Persona', field: 'apellidoNombre',
                sortable: true,
                type: FieldType.string,
                maxWidth: 250,
                minWidth: 170,
                formatter: Formatters.complexObject,
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
                onCellChange: this.personChange.bind(this),
            },
            {
                id: 'forma', name: 'Forma', field: 'forma',
                sortable: true,
                type: FieldType.object,
                maxWidth: 50,
                minWidth: 50,
                formatter: Formatters.complexObject,
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
                formatter: Formatters.complexObject,
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
        ]

        this.columnas = this.columnDefinitions
        this.excelExportOption = {
            filename: `${this.selectedPeriod.year}/${this.selectedPeriod.month}/${this.selectedObjetivoId}`,
            columnHeaderStyle: {
                alignment: { horizontal: 'center' },
                font: { color: 'black' , size: 10, bold: true},
                fill: { type: 'pattern', patternType: 'solid', fgColor: '6A9BCC' },
            }
        }
        this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.grid-container-asis', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptionsEdit.enableRowDetailView = false
        this.gridOptionsEdit.autoEdit = true

        this.gridOptionsEdit.editable = false
        this.gridOptionsEdit.enableAutoSizeColumns = true
        this.gridOptionsEdit.fullWidthRows = true

        this.gridOptionsEdit.showFooterRow = true
        this.gridOptionsEdit.createFooterRow = true

        this.gridOptionsEdit.enableExcelExport = false

        this.gridOptionsEdit.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {
            //            let undoCommandArr:EditCommand[]=[]
            this.angularGridEdit.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridEdit.dataView.getItemMetadata)
            this.angularGridEdit.slickGrid.invalidate();

            const lastrow: any = this.gridDataInsert[this.gridDataInsert.length - 1];
            if (lastrow && (lastrow.apellidoNombre)) {
                this.addNewItem("bottom")
            } else if (!row.apellidoNombre.id && (row.id != lastrow.id)) {
                this.angularGridEdit.gridService.deleteItemById(row.id)
            }
            //Intento grabar si tiene error hago undo

            try {
                //                undoCommandArr.push(editCommand)
                if (column.type == FieldType.number || column.type == FieldType.float)
                    editCommand.serializedValue = Number(editCommand.serializedValue)

                if (editCommand.serializedValue === editCommand.prevSerializedValue) return
                editCommand.execute()
                const item = this.gridDataInsert.find((obj: any) => {
                    return (obj.id == row.id)
                })
                if (item.total != undefined) {
                    const response = await this.insertDB(item)
                    if (item.total == 0 && response.deleteRowId)
                        this.angularGridEdit.gridService.deleteItemById(response.deleteRowId)
                    if (response.categoria || response.forma) {
                        item.categoria = response.categoria ? response.categoria : item.categoria
                        item.forma = response.forma ? response.forma : item.forma
                        this.angularGridEdit.gridService.updateItemById(row.id, item)
                    }
                    if (response.newRowId && response.newRowId != row.id) {
                        /*
                        //Metodo 1
                        this.gridDataInsert.pop()
                        let newData = this.gridDataInsert.map((obj: any) => {
                            if (obj.id == row.id) {
                                obj.id = response.newRowId
                            } else if (obj.id == response.newRowId) {
                                obj.id = row.id
                            }
                            return obj
                        })
                        this.angularGridEdit.dataView.setItems(newData)
                        this.gridDataInsert = newData
                        this.addNewItem("bottom")
                        */
                        
                        //Metodo 2
                        const newData = this.angularGridEdit.dataView.getItems().map((obj: any) => {
                            if (obj.id == row.id) {
                                obj.id = response.newRowId
                            } else if (obj.id == response.newRowId) {
                                obj.id = row.id
                            }
                            return obj
                        })
                        this.angularGridEdit.dataView.setItems(newData)

                    }
                }
            } catch (e: any) {
                console.log('error', e)
                if (e.error.data.categoria) {
                    let item = this.gridDataInsert.find((obj: any) => {
                        return (obj.id == row.id)
                    })
                    item.categoria = e.error.data.categoria ? e.error.data.categoria : item.categoria
                    item.forma = e.error.data.forma ? e.error.data.forma : item.forma
                    this.angularGridEdit.gridService.updateItemById(row.id, item)

                } else if (editCommand && SlickGlobalEditorLock.cancelCurrentEdit()) {
                    this.angularGridEdit.gridService.updateItemById(row.id, editCommand.editor.args.item)
                    editCommand.undo();
                }
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
            x.updateTotals(String(args.column.id), x.angularGridEdit)
        });




        this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
            //            console.log('arg',arg)
            //            totalRecords(this.angularGridEdit)
            //            columnTotal('day1', this.angularGridEdit)
            //            columnTotal('total', this.angularGridEdit)

        })

    }

    updateTotals(columnId: string, angularGrid: AngularGridInstance) {
        if (columnId.indexOf('day') != -1) columnTotal(columnId, angularGrid)
        totalRecords(angularGrid, 'apellidoNombre')
        columnTotal('total', angularGrid)
    }

    sumTotalsFormatterCustom(totals : any, columnDef : any ) {
        const val = totals.sum && totals.sum[columnDef.field];
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
            columnDays.push({
                id: `day${index}`,
                name: `${name} <BR>${index}`,
                field: `day${index}`,
                sortable: true,
                type: FieldType.float,
                maxWidth: 55,
                headerCssClass: (dow == 6 || dow == 0) ? 'grid-weekend' : '',
                //                formatter : Formatters.multiple,
                //                params: {
                //                    formatters: [Formatters.currency],
                //                    thousandSeparator: '.',
                //                    decimalSeparator: ',',
                //                },
                cssClass: 'text-right',
                editor: { model: Editors.float, decimal: 1 },
                onCellChange: this.onHoursChange.bind(this),
                excelExportOptions: {
                    width: 5,
                },
                groupTotalsFormatter: this.sumTotalsFormatterCustom,
            });
        }

        columnDays.push({
            id: `total`,
            name: `Total`,
            field: 'total',
            sortable: true,
            type: FieldType.float,
            maxWidth: 50,
            minWidth: 50,
            cssClass: 'text-right',
            excelExportOptions: {
                width: 6,
            },
            groupTotalsFormatter: this.sumTotalsFormatterCustom,
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

    onHoursChange(e: Event, args: any) {
        const item = args.dataContext
        const keysDays = Object.keys(item).filter(key => key.startsWith("day"))
        const total = keysDays.reduce((acc, key) => {
            const value = parseFloat(item[key]);
            return isNaN(value) ? acc : acc + value;
        }, 0);

        const idItemGrid = args.dataContext.id
        const updateItem = {
            ...args.dataContext,
            total: total
        }
        this.angularGridEdit.gridService.updateItemById(idItemGrid, updateItem)
        //        this.insertDB(args.dataContext.id)
    }

    personChange(e: Event, args: any) {
        //        let item = args.dataContext
        //        item.categoria = {}
        //        item.tipo = ''
        //        this.angularGridEdit.gridService.updateItemById(item.id, item)
    }

    // categoryChange(e: Event, args: any) {
    //     console.log('HUBO CAMBIO DE CATEGORIA');
    // }

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
                categoriaPersonalId: categoria.id,
                formaLiquidacion: forma.id,
            }

            return firstValueFrom(this.apiService.addAsistencia(outItem))
        }
    }

    async endCargaAsistencia() {
        const editable = this.angularGridEdit.slickGrid.getOptions().editable
        if (editable)
            this.angularGridEdit.slickGrid.setOptions({ editable: false })

        try {
            const res = await firstValueFrom(this.apiService.endAsistenciaPeriodo(this.selectedPeriod.year, this.selectedPeriod.month, this.selectedObjetivoId))
            this.$selectedObjetivoIdChange.next(this.selectedObjetivoId)
        } catch (error) {

        }
        if (editable)
            this.angularGridEdit.slickGrid.setOptions({ editable: true })

    }

    async validaGrilla() {
        this.isLoading = true
        const editable = this.angularGridEdit.slickGrid.getOptions().editable
        if (editable)
            this.angularGridEdit.slickGrid.setOptions({ editable: false })

        try {
            const res = firstValueFrom(this.apiService.validaGrilla(this.selectedPeriod.year, this.selectedPeriod.month, this.selectedObjetivoId)).
            finally(() => { this.isLoading = false })
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
        console.log('getPersonalIdFromGrid')
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

            const list = await firstValueFrom(this.searchService.getListaAsistenciaPersonalAsignadoAnterior(objetivoId, anio, mes))
            if (list.length) {
                this.angularGridEdit.dataView.setItems(list)
                this.gridDataInsert = this.angularGridEdit.dataView.getItems()
                this.addNewItem("bottom")
            }

        }
    }

    async exportGrid() {
        this.groupByForma()
        await this.excelExportService.exportToExcel();
        this.clearGrouping()
    }

    groupByForma() {
        let grandTotal : any
        const lastrow: any = this.gridDataInsert[this.gridDataInsert.length - 1];
        if (lastrow && (lastrow.apellidoNombre == '')){
            grandTotal = this.gridDataInsert.pop()
            this.angularGridEdit.dataView.setItems(this.gridDataInsert)
        }else{
            grandTotal = this.createNewItem(1);
        }

        let aggregatorsArray : any[] = []
        this.columnas.forEach((col : any, index:number)=>{
            if(col.field.startsWith('day')){
                grandTotal[col.field] = this.angularGridEdit.slickGrid.getFooterRowColumn(col.field).innerText
                aggregatorsArray.push(new Aggregators.Sum(col.field))
            }
            if(col.field.startsWith('total')){
                aggregatorsArray.push(new Aggregators.Sum(col.field))
            }
        })
        grandTotal.total = this.angularGridEdit.slickGrid.getFooterRowColumn('total').innerText
        grandTotal.forma = {fullName :'Totales'}
//        this.angularGridEdit.slickGrid.setOptions({ enableGrouping: true })
        
        this.angularGridEdit.dataView.setGrouping({
            getter: (g) =>  g.forma.fullName,
           /*
            formatter: (g) => {
                return `<span style="text-align:star">Forma: ${g.value}</span>   <span style="color:green" style="text-align:end">[${g.count} filas]</span>`;
            },
            
            comparer: (a, b) => {
                return SortComparers.numeric(a.value.fullName, b.value.fullName, SortDirectionNumber.desc);
              },
              */
            aggregators: aggregatorsArray,
            aggregateCollapsed: false,
            lazyTotalsCalculation: true,
        });
        this.angularGridEdit.dataView.addItem(grandTotal)
        let grupos : SlickGroup[] = this.angularGridEdit.dataView.getGroups()
        let grupototal : any = grupos.pop()
        grupototal!.title = ""
        grupos.push(grupototal)
    }

    clearGrouping() {
        this.gridDataInsert.pop()
        this.angularGridEdit.dataView.setGrouping([]);
        const lastrow: any = this.gridDataInsert[this.gridDataInsert.length - 1];
        if (lastrow && (lastrow.apellidoNombre != '')){
            this.addNewItem("bottom")
        }
    }
}