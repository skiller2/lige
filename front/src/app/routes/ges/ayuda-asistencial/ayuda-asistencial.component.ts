import { Component, Injector, viewChild, inject, signal, model, computed } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { AngularGridInstance, AngularUtilService, Column, Editors, FileType, GridOption, OnEventArgs, SlickGrid } from 'angular-slickgrid';
import { BehaviorSubject, Observable, debounceTime, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { CommonModule } from '@angular/common';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';
import { SearchService } from 'src/app/services/search.service';
import { ViewResponsableComponent } from "../../../shared/view-responsable/view-responsable.component";
import { AyudaAsistencialDrawerComponent } from "../ayuda-asistencial-drawer/ayuda-asistencial-drawer.component";

@Component({
    selector: 'app-ayuda-asistencial',
    templateUrl: './ayuda-asistencial.component.html',
    styleUrls: ['./ayuda-asistencial.component.less'],
    providers: [AngularUtilService, ExcelExportService],
    imports: [...SHARED_IMPORTS, FiltroBuilderComponent, CommonModule,
        AyudaAsistencialDrawerComponent
    ]
})
export class AyudaAsistencialComponent {
    formAsist = viewChild.required(NgForm)
    rows: number[] = []
    registerId: string = ''
    tituloDrawer: string = ""
    loadingRec = signal(false)
    loadingApr = signal(false)
    loadingCuo = signal(false)
    refresh = signal(0)
    rowsError = signal<number[]>([])
    visibleDrawer: boolean = false
    selectedPeriod = { year: 0, month: 0 };
    angularGrid!: AngularGridInstance;
    gridOptions!: GridOption;
    gridObj!: SlickGrid;
    excelExportService = new ExcelExportService()
    detailViewRowCount = 1
    startFilters: any[] = []
    listOptions: listOptionsT = { filtros: [], sort: null, };

    formChange$ = new BehaviorSubject('');
    tableLoading$ = new BehaviorSubject(false);

    private apiService = inject(ApiService)
    private searchService = inject(SearchService)
    private angularUtilService = inject(AngularUtilService)
    private settingService = inject(SettingsService)

    conditional = computed(async () => {
        if (this.refresh()) {
            this.formChange('')
        }
    });

    columns$ = this.apiService.getCols('/api/ayuda-asistencial/cols').pipe(map((cols: Column<any>[]) => {
        let mapped = cols.map((col: Column) => {
            if (col.id == 'PersonalPrestamoMonto') {
                col.editor = {
                    model: Editors['float'],
                    decimal: 2,
                    valueStep: 1,
                    minValue: 0,
                    maxValue: 10000000,
                    alwaysSaveOnEnterKey: true,
                    required: true
                }
            }
            if (col.id == 'PersonalPrestamoCantidadCuotas') {
                col.editor = {
                    model: Editors['integer'],
                    valueStep: 1,
                    minValue: 1,
                    maxValue: 100,
                    alwaysSaveOnEnterKey: true,
                    required: true
                }
            }
            if (col.id == 'PersonalPrestamoAplicaEl') {
                col.editor = {
                    model: Editors['text'],
                    alwaysSaveOnEnterKey: true,
                    required: true
                }
            }
            return col
        });
        return mapped
    }));

    gridData$ = this.formChange$.pipe(
        debounceTime(500),
        switchMap(() => {
            return this.searchService.getPersonasAyudaAsistencial(
                { anio: this.selectedPeriod.year, mes: this.selectedPeriod.month, options: this.listOptions }
            )
                .pipe(
                    map((data: any) => { return data }),
                    doOnSubscribe(() => this.tableLoading$.next(true)),
                    tap({ complete: () => this.tableLoading$.next(false) })
                )
        })
    )

    async ngOnInit() {
        this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptions.enableRowDetailView = false
        this.gridOptions.autoEdit = true
        this.gridOptions.editable = true
        this.gridOptions.showFooterRow = true
        this.gridOptions.createFooterRow = true
        this.gridOptions.enableCheckboxSelector = true
        this.gridOptions.rowSelectionOptions = {
            selectActiveRow: false
        }
        this.gridOptions.cellHighlightCssClass = 'changed'
        this.gridOptions.enableCellNavigation = true

        this.gridOptions.editCommandHandler = async (item, column, editCommand) => {
            if (column.id != 'PersonalPrestamoAplicaEl' && column.id != 'PersonalPrestamoCantidadCuotas' && column.id != 'PersonalPrestamoMonto')
                return

            editCommand.execute();
            //Verifico que los campos
            if (!item.PersonalPrestamoAplicaEl || !item.PersonalPrestamoCantidadCuotas || !item.PersonalPrestamoMonto) {
                return
            }

            try {
                const res = await firstValueFrom(this.apiService.updateRowAyudaAsistencial(item))
                this.angularGrid.dataView.updateItem(item.id, { ...item, ...res.data });
                this.angularGrid.slickGrid.updateRow(editCommand.row)
            } catch (err) {
                editCommand.undo()
            }


        }

        this.startFilters = [{ field: 'PersonalPrestamoAprobado', condition: 'AND', operator: '=', value: 'S', forced: false }]

    }

    ngAfterViewInit(): void {
        const now = new Date();
        setTimeout(() => {
            const anio = now.getFullYear()
            const mes = now.getMonth() + 1
            this.selectedPeriod.year = anio
            this.selectedPeriod.month = mes
            this.formAsist().form.get('periodo')?.setValue(new Date(anio, mes - 1, 1));
        }, 1);
    }

    async angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid.detail
        this.gridObj = angularGrid.detail.slickGrid;

        this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
            totalRecords(this.angularGrid)
            columnTotal('PersonalPrestamoMonto', this.angularGrid)

        })

    }

    handleOnBeforeEditCell(e: Event) {
        const { column, item, grid } = (<CustomEvent>e).detail.args;
        if (column.id != 'PersonalPrestamoAplicaEl' && column.id != 'PersonalPrestamoCantidadCuotas' && column.id != 'PersonalPrestamoMonto') {
            e.stopImmediatePropagation();
            return false
        }

        if (item.PersonalPrestamoAprobado === 'S') {
            e.stopImmediatePropagation();
            return false
        }
        return true;
    }

    handleSelectedRowsChanged(e: any): void {
        this.rows = e.detail.args.rows
        if (e.detail.args.changedSelectedRows.length == 1) {
            this.registerId = this.angularGrid.dataView.getItemByIdx(e.detail.args.changedSelectedRows[0]).id
        } else
            this.registerId = ''
    }

    listOptionsChange(options: any) {
        this.listOptions = options;
        this.formChange('');
    }

    dateChange(result: Date): void {
        this.selectedPeriod.year = result.getFullYear();
        this.selectedPeriod.month = result.getMonth() + 1;
        this.rows = []
        this.registerId = ''
        this.formChange('');
    }

    formChange(event: any) {
        this.formChange$.next(event);
    }

    async rechazarReg() {
        this.loadingRec.set(true)
        this.rowsError.set([])
        const ids = this.angularGrid.dataView.getAllSelectedFilteredIds()
        // console.log(ids,this.rows);
        try {
            await firstValueFrom(this.apiService.ayudaAsistencialRechazar({ ids: ids, rows: this.rows }))
            this.formChange('')
        } catch (error: any) {
            let rows: any[] = error.error.data
            // console.log('ERROR:',rows)
            this.rowsError.set(rows)
        }
        this.changeBackgroundColor()
        this.loadingRec.set(false)
    }

    async aprobarReg() {
        this.loadingApr.set(true)
        this.rowsError.set([])
        const ids = this.angularGrid.dataView.getAllSelectedFilteredIds()
        // console.log(ids,this.rows);
        try {
            const res: any = await firstValueFrom(this.apiService.ayudaAsistencialAprobar({ ids: ids, rows: this.rows }))
            this.formChange('')
        } catch (error: any) {
            let rows: any[] = error.error.data
            // console.log('ERROR:',rows)
            this.rowsError.set(rows)
        }
        this.changeBackgroundColor()
        this.loadingApr.set(false)
    }

    async addCuotaReg() {
        this.loadingCuo.set(true)
        const ids = this.angularGrid.dataView.getAllSelectedFilteredIds()
        // console.log(ids,this.rows);
        try {
            const res: any = await firstValueFrom(this.apiService.ayudaAsistencialAddCuota({ year: this.selectedPeriod.year, month: this.selectedPeriod.month }))
            this.formChange('')
        } catch (error) {
            console.log(error);
        }
        this.loadingCuo.set(false)
    }

    openDrawer(): void {
        this.visibleDrawer = true
        this.tituloDrawer = "Alta"
    }

    changeBackgroundColor() {
        this.angularGrid.dataView.getItemMetadata = this.updateItemMetadata(this.angularGrid.dataView.getItemMetadata);

        const selectedRows = this.angularGrid.slickGrid.getSelectedRows();
        const rowsError = this.rowsError()
        const newSelectedRows = selectedRows.filter(num => !rowsError.includes(num))
        this.angularGrid.slickGrid.setSelectedRows(newSelectedRows);

        this.gridObj.invalidate();
        this.gridObj.render();
    }

    updateItemMetadata(previousItemMetadata: any) {
        const newCssClass = 'element-add-no-complete';

        return (rowNumber: number) => {
            const item = this.angularGrid.dataView.getItem(rowNumber);

            let meta = {
                cssClasses: ''
            };
            if (typeof previousItemMetadata === 'object') {
                meta = previousItemMetadata(rowNumber);
            }

            if (meta && item) {
                const row = this.rowsError();
                if (row.find((num) => num == rowNumber)) {
                    meta.cssClasses = (meta.cssClasses || '') + ' ' + newCssClass;
                } else {
                    meta.cssClasses = ''
                }
            }

            return meta;
        };
    }

}