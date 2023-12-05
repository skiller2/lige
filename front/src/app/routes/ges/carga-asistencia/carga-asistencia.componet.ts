import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { AngularGridInstance, AngularUtilService, Column, FieldType, FileType, Formatters, GridOption, SlickGrid, GroupTotalFormatters, Aggregators } from 'angular-slickgrid';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { NzModalService, NzModalModule } from "ng-zorro-antd/modal";
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject, Observable, debounceTime, map, switchMap, tap } from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from 'src/app/shared/row-preload-detail/row-preload-detail.component';
import { SharedModule, listOptionsT } from 'src/app/shared/shared.module';
import { CustomDescargaComprobanteComponent } from '../objetivos-pendasis/objetivos-pendasis.component';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { CustomGridEditor } from '../../../shared/custom-grid-editor/custom-grid-editor.component';
import { EditorPersonaComponent } from '../../../shared/editor-persona/editor-persona.component';

@Component({
    selector: 'app-carga-asistencia',
    templateUrl: './carga-asistencia.componet.html',
    styleUrls: ['./carga-asistencia.componet.less'],
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        NzAffixModule,
        FiltroBuilderComponent,
        RowPreloadDetailComponent,
        RowDetailViewComponent,
    ],
    providers: [AngularUtilService]
})

export class CargaAsistenciaComponent {
    @ViewChild('carasistForm', { static: true }) carasistForm: NgForm =
        new NgForm([], []);
    constructor(private cdr: ChangeDetectorRef, public apiService: ApiService, private injector: Injector, public router: Router, private angularUtilService: AngularUtilService, private modal: NzModalService, private notification: NzNotificationService) { }

    columnDefinitions: Column[] = [];
    column: Column[] = [];
    gridOptionsEdit!: GridOption;
    gridDataInsert = [];

    excelExportService = new ExcelExportService()
    // angularGrid!: AngularGridInstance;
    angularGridEdit!: AngularGridInstance;
    detailViewRowCount = 3;
    selectedPeriod = { year: 0, month: 0 };

    async ngOnInit() {
        this.columnDefinitions = [
            {
                id: 'ApellidoNombre', name: 'Persona', field: 'ApellidoNombre',
                sortable: true,
                type: FieldType.string,
                // maxWidth: 250,
            },
            {
                id: 'CUIT', name: 'CUIT', field: 'CUIT',
                sortable: true,
                type: FieldType.number,
                // maxWidth: 150,
            },
            {
                id: 'Forma', name: 'Forma', field: 'Forma',
                sortable: true,
                type: FieldType.string,
                // maxWidth: 150,
            },
        ]
        this.gridOptionsEdit = this.apiService.getDefaultGridOptions('.grid-container-asis', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptionsEdit.enableRowDetailView = false
        this.gridOptionsEdit.autoEdit = true

        this.gridOptionsEdit.enableAutoSizeColumns = false
        this.gridOptionsEdit.frozenColumn = 2
        // this.gridOptionsEdit.enableAutoResize = false
        // this.gridOptionsEdit.enableColumnReorder = false
        // this.gridOptionsEdit.enableAutoResizeColumnsByCellContent = true
        this.gridOptionsEdit.enableAutoTooltip = true
        this.gridOptionsEdit.fullWidthRows = true
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

    onCellChanged(e: any) { }

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
            ApellidoNombre: '',
            CUIT: '',
            Forma: ''
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
                field: 'day',
                sortable: true,
                type: FieldType.number,
                maxWidth: 50,
                headerCssClass:(dow==6 || dow==0)?'grid-weekend':'',
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
        console.log(daysOfMonth)
        this.column = [...this.columnDefinitions, ...daysOfMonth];
        
        this.angularGridEdit.slickGrid.setOptions({ forceFitColumns: true })
        this.angularGridEdit.slickGrid.reRenderColumns(true)
    }
}