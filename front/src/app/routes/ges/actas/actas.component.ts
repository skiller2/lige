import { CommonModule } from '@angular/common';
import { Component, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, computed } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption, Column, Editors, EditCommand, FieldType, SlickGlobalEditorLock } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, timer } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"

@Component({
    selector: 'app-actas',
    templateUrl: './actas.component.html',
    styleUrls: ['./actas.component.less'],
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule,
        FiltroBuilderComponent, 
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActasComponent {
    public router = inject(Router);
    public route = inject(ActivatedRoute);

    angularGrid!: AngularGridInstance;
    gridOptions!: GridOption;
    gridData: any;
    rows: number[] = [];
    detailViewRowCount = 1;
    excelExportService = new ExcelExportService();
    listActas$ = new BehaviorSubject('');
    listOptions: listOptionsT = {
        filtros: [],
        sort: null,
    };
    startFilters: any[] = []

    rowLocked = signal<boolean>(false);
    selectedActaId = signal<number>(0);
    selectedNroActa = signal<number>(0);

    constructor(
        private searchService: SearchService,
        private apiService: ApiService,
        private angularUtilService: AngularUtilService,
        private injector: Injector,
    ) { }

    columns$ = this.apiService.getCols('/api/actas/cols').pipe(map((cols: Column<any>[]) => {
        let mapped = cols.map((col: Column) => {
          if (col.id == 'ActaNroActa') {
            // col.cssClass = 'text-right',
            col.editor = {
              model: Editors['integer'],
              minValue: 0,
              maxValue: 10000000,
              alwaysSaveOnEnterKey: true,
            //   required: true
            }
          }
          return col
        });
        return mapped
    }));

    $optionsEstadoCust = this.searchService.getEstadoCustodia();

    gridData$ = this.listActas$.pipe(
        debounceTime(500),
        switchMap(() => {
            return this.apiService.getActas(this.listOptions)
                .pipe(map(data => { return data }))
        })
    )

    async ngOnInit() {
        this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptions.enableRowDetailView = false
        this.gridOptions.enableAutoSizeColumns = true
        // this.gridOptions.fullWidthRows = true
        this.gridOptions.showFooterRow = true
        this.gridOptions.createFooterRow = true
        // this.gridOptions.enableCheckboxSelector = true
        this.gridOptions.editable = true
        this.gridOptions.autoEdit = true

        this.gridOptions.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {
            this.angularGrid.dataView.getItemMetadata = this.updateItemMetadata(this.angularGrid.dataView.getItemMetadata)
            this.angularGrid.slickGrid.invalidate();
            //Intento grabar si tiene error hago undo
            try {
                if (column.type == FieldType.number || column.type == FieldType.float)
                    editCommand.serializedValue = Number(editCommand.serializedValue)

                if (JSON.stringify(editCommand.serializedValue) === JSON.stringify(editCommand.prevSerializedValue)) return
                
                editCommand.execute()
                
                while (this.rowLocked()) await firstValueFrom(timer(100));
                row = this.angularGrid.dataView.getItemById(row.id)
                
                if (row.ActaId){
                    this.rowLocked.set(true)
                    await firstValueFrom(this.apiService.updateActa(row))
                }else{
                    this.rowLocked.set(true)
                    const response = await firstValueFrom(this.apiService.addActa(row))
                    row.ActaId = response.data.ActaId
                    this.angularGrid.gridService.updateItemById(row.id, row)
                    this.selectedActaId.set(row.ActaId)
                    this.selectedNroActa.set(row.ActaNroActa)
                }
                this.rowLocked.set(false)
            } catch (e: any) {
                console.log('Error :' , e);
                
                //marcar el row en rojo
                if (row.ActaId) {
                    if (editCommand && SlickGlobalEditorLock.cancelCurrentEdit())
                        editCommand.undo();
                } else {
                    this.angularGrid.slickGrid.setSelectedRows([]);
                    this.angularGrid.slickGrid.render();
                }
                this.rowLocked.set(false)
            }
        }
    }

    async angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid.detail
        this.gridData = angularGrid.dataView
        this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
            // totalRecords(this.angularGrid, 'cliente')
            // columnTotal('facturacion', this.angularGrid)
        })
        if (this.apiService.isMobile())
            this.angularGrid.gridService.hideColumnByIds([])
    }

    listOptionsChange(options: any) {
        this.listOptions = options;
        this.refreshListActas('')
    }

    refreshListActas(event: any) {
        this.listActas$.next(event);
    }

    handleSelectedRowsChanged(e: any): void {
        const selrow = e.detail.args.rows[0]
        const row = this.angularGrid.slickGrid.getDataItem(selrow)
        if (row) {
            this.selectedActaId.set(row.ActaId)
            this.selectedNroActa.set(row.ActaNroActa)
        }
        
    }

    createNewItem(incrementIdByHowMany = 1) {
        const dataset = this.angularGrid.dataView.getItems();
        let highestId = 0;
        dataset.forEach((item: any) => {
            if (item.id > highestId) {
                highestId = item.id;
            }
        });
        const newId = highestId + incrementIdByHowMany;

        return {
            id: newId,
            ActaId: 0,
            ActaNroActa: 0,
            ActaDescripcion:"",
            ActaFechaActa:"",
            ActaFechaHasta: "",
        };
    }

    async addNewItem() {
        const newItem1 = this.createNewItem(1);
        this.angularGrid.gridService.addItem(newItem1, { position: 'bottom', highlightRow: false, scrollRowIntoView: true, triggerEvent: false })
    }


    updateItemMetadata(previousItemMetadata: any) {
        return (rowNumber: number) => {
        // const newCssClass = 'element-add-no-complete';
        const item = this.angularGrid.dataView.getItem(rowNumber);
        let meta = {
            cssClasses: ''
        };
        if (typeof previousItemMetadata === 'object') {
            meta = previousItemMetadata(rowNumber);
        }
        
        if (
            //item.ActaId === 0 || 
            item.ActaNroActa === 0 || 
            item.ActaDescripcion === "" || 
            item.ActaFechaActa === "" || 
            item.ActaFechaHasta === ""
        ) {
            meta.cssClasses = 'element-add-no-complete';
        } else
            meta.cssClasses = ''
    
        const fechaActa:Date = new Date(item.ActaFechaActa)
        const fechaHasta:Date = new Date(item.ActaFechaHasta)
        //  La FechaHasta debe de ser mayor a la FechaActa
        if (item.ActaFechaActa && item.ActaFechaHasta && (fechaActa.getTime() > fechaHasta.getTime()))
            meta.cssClasses = 'element-add-no-complete';

      return meta;
    };
  }

    async deleteItem() {
        await firstValueFrom(this.apiService.deleteActa(this.selectedActaId()))
        this.selectedActaId.set(0)
        this.selectedNroActa.set(0)
        this.refreshListActas('')
    }

}