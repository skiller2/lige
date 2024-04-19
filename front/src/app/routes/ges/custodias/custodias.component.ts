// import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS } from '@shared';
// import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
// import { SearchService } from 'src/app/services/search.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-custodias',
    templateUrl: './custodias.component.html',
    styleUrls: ['./custodias.component.less'],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS]
})
export class CustodiaComponent {
    @ViewChild('custodiasForm', { static: true }) liquidacionesForm: NgForm =
    new NgForm([], [])
    public router = inject(Router);
    public route = inject(ActivatedRoute);

    angularGridLista!: AngularGridInstance;
    angularGridCarga!: AngularGridInstance;
    gridOptionsLista!: GridOption;
    gridOptionsCarga!: GridOption;
    gridDataInsertLista: any[] = [];
    gridDataInsertCarga: any[] = [];
    personalLista = [];
    personalCarga = [
        {
          title: 'Agregar'
        },
      ];
    columnas: Column[] = [];
    detailViewRowCount = 1;
    excelExportService = new ExcelExportService()
    
    loading = false;

    private angularUtilService = inject(AngularUtilService)
    public apiService = inject(ApiService)

    async ngOnInit(){
        this.columnas = [
            {
                id:'responsable' , name:'Responsable' , field:'responsable',
                sortable: true,
                type: FieldType.string,
                maxWidth: 250,
                minWidth: 170,
            },
            {
                id:'cliente' , name:'Cliente' , field:'cliente',
                sortable: true,
                type: FieldType.string,
                maxWidth: 200,
                minWidth: 150,
            },
            {
                id:'descripcion' , name:'Descripcion' , field:'descripcion',
                sortable: true,
                type: FieldType.text,
                maxWidth: 300,
                minWidth: 170,
            },
            {
                id:'fechaA' , name:'Fecha Hora Inicio' , field:'fechaA',
                sortable: true,
                type: FieldType.dateTimeShortUs,
                maxWidth: 130,
                minWidth: 110,
            },
            {
                id:'origen' , name:'Origen' , field:'origen',
                sortable: true,
                type: FieldType.string,
                maxWidth: 190,
                minWidth: 140,
            },
            {
                id:'fechaB' , name:'Fecha Hora Final' , field:'fechaB',
                sortable: true,
                type: FieldType.dateTimeShortUs,
                maxWidth: 130,
                minWidth: 110,
            },
            {
                id:'destino' , name:'Destino' , field:'destino',
                sortable: true,
                type: FieldType.string,
                maxWidth: 190,
                minWidth: 140,
            },
            {
                id:'estado' , name:'Estado' , field:'estado',
                sortable: true,
                type: FieldType.string,
                maxWidth: 100,
                minWidth: 90,
            },
        ]

        this.gridOptionsLista = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptionsCarga = this.apiService.getDefaultGridOptions('.gridLoadContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptionsCarga.enableRowDetailView = false
        this.gridOptionsCarga.autoEdit = true
        this.gridOptionsCarga.enableAutoSizeColumns = true
        this.gridOptionsCarga.fullWidthRows = true
        this.gridOptionsCarga.showFooterRow = true
        this.gridOptionsCarga.createFooterRow = true
        this.gridOptionsCarga.enableExcelExport = false
    }

    async angularGridReadyLista(angularGrid: any) {
        this.angularGridLista = angularGrid.detail
        //this.gridObjEdit = angularGrid.detail.slickGrid;

        if (this.apiService.isMobile())
            this.angularGridLista.gridService.hideColumnByIds([])
    }

    async angularGridReadyCarga(angularGrid: any) {
        this.angularGridCarga = angularGrid.detail
        //this.gridObjEdit = angularGrid.detail.slickGrid;

        setTimeout(() => {
            if (this.gridDataInsertCarga.length == 0)
                this.addNewItem("bottom")
        }, 500);

        if (this.apiService.isMobile())
            this.angularGridCarga.gridService.hideColumnByIds([])
    }

    onCellChanged(e: any) {
        console.log(this.gridDataInsertCarga);
        
    }

    addNewItem(insertPosition?: 'bottom') {
        const newItem1 = this.createNewItem(1);
        this.angularGridCarga.gridService.addItem(newItem1, { position: insertPosition, highlightRow: false, scrollRowIntoView: false, triggerEvent: false });
    }

    createNewItem(incrementIdByHowMany = 1) {
        const dataset = this.angularGridCarga.dataView.getItems();
        let highestId = 0;
        dataset.forEach((item: any) => {
            if (item.id > highestId) {
                highestId = item.id;
            }
        });
        const newId = highestId + incrementIdByHowMany;
        return {
            id: newId,
            cliente: '',
            descripcion: '',
            fechaA: '',
            origen:'',
            fechaB: '',
            destino:'',
            estado: ''
        };
    }
}