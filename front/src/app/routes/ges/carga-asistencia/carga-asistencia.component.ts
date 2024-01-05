import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects } from 'angular-slickgrid';
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
    imports: [...SHARED_IMPORTS, FiltroBuilderComponent, CommonModule, PersonalSearchComponent, ObjetivoSearchComponent],
    providers: [AngularUtilService]
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
    angularGridEdit!: AngularGridInstance;
    detailViewRowCount = 1;
    selectedPeriod = { year: 0, month: 0 };
    selectedSucursalId = 0
    objetivoData: any
    ObjetivoIdUrl: any

    public get Busqueda() {
        return Busqueda;
    }
    selectedObjetivoId: number = 0
    $isObjetivoDataLoading = new BehaviorSubject(false);
    $selectedObjetivoIdChange = new BehaviorSubject(0);
    $formChange = new BehaviorSubject({});
    objetivoResponsablesLoading$ = new BehaviorSubject<boolean | null>(null);

    getObjetivoDetalle(objetivoId: number, anio: number, mes: number): Observable<any> {
        this.loadingSrv.open({ type: 'spin', text: '' })
        return forkJoin([
            this.searchService.getObjetivo(objetivoId, anio, mes),
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

                this.angularGridEdit.slickGrid.setOptions(this.gridOptionsEdit);

                this.angularGridEdit.slickGrid.setOptions(this.gridOptionsEdit);
                this.angularGridEdit.resizerService.resizeGrid();

                console.log('data[3]', data[3]);
                if (data[3].length) {
                    this.angularGridEdit.dataView.setItems(data[3])
                    this.gridDataInsert = this.angularGridEdit.dataView.getItems()
                    this.addNewItem("bottom")
                } else {
                    this.clearAngularGrid()
                }

                for (const col of this.angularGridEdit.slickGrid.getColumns())
                    if (String(col.id).indexOf('day') != -1) columnTotal(String(col.id), this.angularGridEdit)
                totalRecords(this.angularGridEdit)
                columnTotal('total', this.angularGridEdit)

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
                params: {
                    complexFieldLabel: 'apellidoNombre.fullName',
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
                type: FieldType.string,
                maxWidth: 50,
                minWidth: 50,
                formatter: Formatters.complexObject,
                params: {
                    complexFieldLabel: 'forma.fullName',
                },

                editor: {
                    model: CustomInputEditor,
                    collection: [],
                    params: {
                        component: EditorTipoHoraComponent,
                    },
                    alwaysSaveOnEnterKey: true,
                    // required: true
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
            },
        ]

        this.columnas = this.columnDefinitions
        this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.grid-container-asis', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptionsEdit.enableRowDetailView = false
        this.gridOptionsEdit.autoEdit = true

        this.gridOptionsEdit.editable = false
        this.gridOptionsEdit.enableAutoSizeColumns = true
        this.gridOptionsEdit.fullWidthRows = true

        this.gridOptionsEdit.showFooterRow = true
        this.gridOptionsEdit.createFooterRow = true

        this.gridOptionsEdit.editCommandHandler = async (row, column, editCommand: EditCommand) => {
            //            let undoCommandArr:EditCommand[]=[]

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

                await this.insertDB(row)
            } catch (e) {
                //                const undoCommand = undoCommandArr.pop()
                if (editCommand && SlickGlobalEditorLock.cancelCurrentEdit()) {
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
            //                console.log('args',args)
            columnTotal(String(args.column.id), x.angularGridEdit)
            columnTotal('total', x.angularGridEdit)
            totalRecords(x.angularGridEdit)

        });


        this.angularGridEdit.dataView.onRowsChanged.subscribe((e, arg) => {
            //            console.log('arg',arg)
            //            totalRecords(this.angularGridEdit)
            //            columnTotal('day1', this.angularGridEdit)
            //            columnTotal('total', this.angularGridEdit)

        })

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
            tipo: '',
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
                name: `${name} <BR> ${index}`,
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
            });
        }

        columnDays.push({
            id: `total`,
            name: `Total`,
            field: 'total',
            sortable: true,
            type: FieldType.number,
            maxWidth: 50,
            minWidth: 50,
            cssClass: 'text-right',
        });

        return columnDays
    }

    async formChange(result: Date | String, busqueda: Busqueda): Promise<void> {
        //console.log('formChange', result)
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

    async selectedObjetivoChange(event: string, busqueda: Busqueda): Promise<void> {

        this.clearAngularGrid()
    }

    personChange(e: Event, args: any) {
        /*
        if(args.dataContext.apellidoNombre?.id){
            const idPersona = args.dataContext.apellidoNombre.id
            const idItemGrid = args.dataContext.id
            this.searchService.getCategoriasPersona(
                Number(idPersona),
                this.selectedPeriod.year,
                this.selectedPeriod.month
            ).subscribe((datos) => {
                if(datos.categorias.length){
                    let editColumns = this.angularGridEdit.slickGrid.getColumns()
                    this.editColumnSelectOptions('categoria', datos.categorias, 'CategoriaPersonalDescripcion', editColumns)
                    this.editColumnSelectOptions('tipo', datos.categorias,'TipoAsociadoDescripcion', editColumns)
                    this.angularGridEdit.slickGrid.setColumns(editColumns)
    
                    const updateItem = {
                        ... args.dataContext,
                        forma: 'HORAS NORMALES',
                        tipo: datos.categorias[0].TipoAsociadoDescripcion,
                        categoria: datos.categorias[0].CategoriaPersonalDescripcion,
                    }
                    this.angularGridEdit.gridService.updateItemById(idItemGrid, updateItem)
                    
                }
            })
        }
        */
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
            let { apellidoNombre, categoria, forma, tipo, ...row } = item

            const outItem = {
                ...row,
                ...this.selectedPeriod,
                objetivoId: this.selectedObjetivoId,
                personalId: apellidoNombre.id,
                tipoAsociadoId: tipo.id,
                categoriaPersonalId: categoria.id,
                formaLiquidacion: forma.id,
            }

            return firstValueFrom(this.apiService.addAsistencia(outItem))
            /*
                        this.apiService.addAsistencia(item)
                            .pipe(
                                //               doOnSubscribe(() => this.saveLoading$.next(true)),
                                tap({
                                    complete: () => {
                                    },
                                    //                  finalize: () => this.saveLoading$.next(false),
                                })
                            )
                            .subscribe();
            */
        }
    }

    endCargaAsistencia() {
        const res = firstValueFrom(this.apiService.endAsistenciaPeriodo(this.selectedPeriod.year, this.selectedPeriod.month, this.selectedObjetivoId)
        ).finally(() => { this.$selectedObjetivoIdChange.next(this.selectedObjetivoId) })

    }

    setCargaAsistencia() {
        const res = firstValueFrom(this.apiService.addAsistenciaPeriodo(this.selectedPeriod.year, this.selectedPeriod.month, this.selectedObjetivoId)
        ).finally(() => { this.$selectedObjetivoIdChange.next(this.selectedObjetivoId) })
    }

}