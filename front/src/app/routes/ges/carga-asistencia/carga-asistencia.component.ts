import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption } from 'angular-slickgrid';
import { NzModalService } from "ng-zorro-antd/modal";
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject, debounceTime, switchMap, tap } from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { SHARED_IMPORTS } from '@shared';
import { CustomGridEditor } from '../../../shared/custom-grid-editor/custom-grid-editor.component';
import { EditorPersonaComponent } from '../../../shared/editor-persona/editor-persona.component';
import { SearchService } from '../../../services/search.service';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
enum Busqueda {
    Sucursal,
    Objetivo,
    Personal,
    Responsable
  }

@Component({
    selector: 'app-carga-asistencia',
    templateUrl: './carga-asistencia.component.html',
    styleUrls: ['./carga-asistencia.component.less'],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
  imports: [...SHARED_IMPORTS, FiltroBuilderComponent, CommonModule,PersonalSearchComponent,ObjetivoSearchComponent],

    // imports: [
    //     CommonModule,
    //     SHARED_IMPORTS,
    //     NzAffixModule,
    //     FiltroBuilderComponent,
    //     RowPreloadDetailComponent,
    //     RowDetailViewComponent,
    // ],
    providers: [AngularUtilService]
})
export class CargaAsistenciaComponent {
    @ViewChild('carasistForm', { static: true }) carasistForm: NgForm =
        new NgForm([], []);
    constructor(
        private cdr: ChangeDetectorRef,
        public apiService: ApiService,
        private injector: Injector,
        public router: Router,
        private angularUtilService: AngularUtilService,
        private modal: NzModalService,
        private notification: NzNotificationService,
        private searchService: SearchService,
    ) { }

    columnDefinitions: Column[] = [];
    columnas: Column[] = [];
    gridOptionsEdit!: GridOption;
    gridDataInsert = [];

    excelExportService = new ExcelExportService()
    angularGridEdit!: AngularGridInstance;
    detailViewRowCount = 1;
    selectedPeriod = { year: 0, month: 0 };
    
    public get Busqueda() {
        return Busqueda;
    }
    selectedObjetivoId = '';
    $isObjetivoDataLoading = new BehaviorSubject(false);
    $selectedObjetivoIdChange = new BehaviorSubject('');
    objetivoResponsablesLoading$ = new BehaviorSubject<boolean | null>(null);

    $objetivoResponsables = this.$selectedObjetivoIdChange.pipe(
        debounceTime(50),
        switchMap(objetivoId => {
          if (!objetivoId) return [];
          return this.searchService
            .getObjetivo(
              Number(objetivoId),
              this.selectedPeriod.year,
              this.selectedPeriod.month
            )
            .pipe(
              doOnSubscribe(() => this.objetivoResponsablesLoading$.next(true)),
              tap({
                complete: () => this.objetivoResponsablesLoading$.next(false),
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
                formatter: Formatters.complexObject,
                params: {
                    complexFieldLabel: 'apellidoNombre.fullName',
                  },
                editor: {
                    model: CustomGridEditor,
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
                maxWidth: 150,
                editor: {
                    model: Editors.singleSelect,
                    collection: ['HORAS NORMALES', 'CAPACITACION'],
                    alwaysSaveOnEnterKey: true,
                    // required: true
                },
            },
            {
                id: 'tipo', name: 'Tipo', field: 'tipo',
                sortable: true,
                type: FieldType.string,
                maxWidth: 150,
                editor: {
                    model: Editors.text,
                    alwaysSaveOnEnterKey: true,
                    // required: true
                },
            },
            {
                id: 'categoria', name: 'Categoria', field: 'categoria',
                sortable: true,
                type: FieldType.string,
                maxWidth: 150,
                editor: {
                    model: Editors.text,
                    alwaysSaveOnEnterKey: true,
                    // required: true
                },
            },
        ]
        this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.grid-container-asis', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptionsEdit.enableRowDetailView = false
        this.gridOptionsEdit.autoEdit = true

        // this.gridOptionsEdit.enableAutoSizeColumns = true
        // this.gridOptionsEdit.frozenColumn = 1
        // this.gridOptionsEdit.enableAutoResize = false
        // this.gridOptionsEdit.enableColumnReorder = false
        // this.gridOptionsEdit.enableAutoResizeColumnsByCellContent = true
        // this.gridOptionsEdit.enableAutoTooltip = true
        // this.gridOptionsEdit.fullWidthRows = true

        this.gridOptionsEdit.editCommandHandler = async (row, column, editCommand) => {
            editCommand.execute()
            const lastrow: any = this.gridDataInsert[this.gridDataInsert.length - 1];
            if (lastrow && (lastrow.apellidoNombre)) {
                this.addNewItem("bottom")
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
        let columnDays:Column[] =[] 
        const daysInMonth = new Date(year, month, 0).getDate();
        // console.log('daysInMonth',daysInMonth);
        const daysOfWeek = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
        for (let index = 1; index <= daysInMonth; index++) {
            let date = new Date(year, month, index);
            const dow=date.getDay()
            let name = daysOfWeek[dow];
            columnDays.push({
                id: `day${index}`,
                name: `${name} <BR> ${index}`,
                field: `day${index}`,
                sortable: true,
                type: FieldType.number,
                maxWidth: 60,
                headerCssClass:(dow==6 || dow==0)?'grid-weekend':'',
                editor: {
                    model: Editors.text
                },
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
        });

        return columnDays
    }

    dateChange(result: Date): void {
        this.selectedPeriod.year = result.getFullYear();
        this.selectedPeriod.month = result.getMonth()+1;

        const daysOfMonth = this.getDaysOfWeekOfMonth(this.selectedPeriod.year, this.selectedPeriod.month);

        this.columnas = [...this.columnDefinitions, ...daysOfMonth];
        
        this.angularGridEdit.slickGrid.setOptions({ forceFitColumns: true, frozenColumn: 2 })
        this.angularGridEdit.slickGrid.reRenderColumns(true)
        this.clearAngularGrid()
    }

    clearAngularGrid():void {
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
            ... args.dataContext,
            total:total
        }
        this.angularGridEdit.gridService.updateItemById(idItemGrid, updateItem)
    }
    
    selectedObjetivoChange(event: string, busqueda: Busqueda): void {
        this.$selectedObjetivoIdChange.next(event);
        this.$isObjetivoDataLoading.next(true);
    }

    personChange(e: Event, args: any) {
        if(args.dataContext.apellidoNombre?.id){
            const idPersona = args.dataContext.apellidoNombre.id
            const idItemGrid = args.dataContext.id
            this.searchService.getCategoriasPersona(
                Number(idPersona),
                this.selectedPeriod.year,
                this.selectedPeriod.month
            ).subscribe((datos) => {
                if(datos.categorias.length){
                    const updateItem = {
                        ... args.dataContext,
                        forma: 'HORAS NORMALES',
                        tipo: datos.categorias[0].CategoriaPersonalDescripcion,
                        categoria: datos.categorias[0].TipoAsociadoDescripcion,
                    }
                    this.angularGridEdit.gridService.updateItemById(idItemGrid, updateItem)
                }
            })
        }
    }

}