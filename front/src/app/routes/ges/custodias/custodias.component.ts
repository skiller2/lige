import { CommonModule } from '@angular/common';
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
import { CustomInputEditor } from '../../../shared/custom-grid-editor/custom-grid-editor.component';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';

@Component({
    selector: 'app-custodias',
    templateUrl: './custodias.component.html',
    styleUrls: ['./custodias.component.less'],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule, PersonalSearchComponent, ClienteSearchComponent]
})
export class CustodiaComponent {
    @ViewChild('custodiasForm', { static: true }) liquidacionesForm: NgForm =
    new NgForm([], [])
    public router = inject(Router);
    public route = inject(ActivatedRoute);

    angularGridLista!: AngularGridInstance;
    gridOptionsLista!: GridOption;
    gridDataInsertLista: any[] = [];
    personalLista = [];
    agregarPersonal = false
    columnasLista: Column[] = [];
    detailViewRowCount = 1;
    excelExportService = new ExcelExportService()

    clienteId = 0
    inputValue: string = ''
    fechaInicial! : Date
    fechaFinal! : Date
    origen : string = ''
    destino : string = ''
    kilometros! : number
    facturacion! : number
    estado : number = 0

    private angularUtilService = inject(AngularUtilService)
    public apiService = inject(ApiService)

    async ngOnInit(){
        this.columnasLista = [
            {
                id:'responsable' , name:'Responsable' , field:'responsable',
                sortable: true,
                type: FieldType.string,
                maxWidth: 100,
                minWidth: 150,
            },
            {
                id:'cliente' , name:'Cliente' , field:'cliente',
                sortable: true,
                type: FieldType.string,
                maxWidth: 170,
                minWidth: 140,
            },
            {
                id:'descripcion' , name:'Descripcion' , field:'descripcion',
                sortable: true,
                type: FieldType.text,
                maxWidth: 300,
                minWidth: 230,
            },
            {
                id:'fechaI' , name:'Fecha Inicio' , field:'fechaI',
                sortable: true,
                type: FieldType.dateTimeShortUs,
                maxWidth: 150,
                minWidth: 110,
            },
            {
                id:'origen' , name:'Origen' , field:'origen',
                sortable: true,
                type: FieldType.string,
                maxWidth: 180,
                minWidth: 140,
            },
            {
                id:'fechaF' , name:'Fecha Final' , field:'fechaB',
                sortable: true,
                type: FieldType.dateTimeShortUs,
                maxWidth: 150,
                minWidth: 110,
            },
            {
                id:'destino' , name:'Destino' , field:'destino',
                sortable: true,
                type: FieldType.string,
                maxWidth: 180,
                minWidth: 140,
            },
            // {
            //     id:'montopersonal' , name:'Monto Personal' , field:'montopersonal',
            //     sortable: true,
            //     type: FieldType.string,
            //     maxWidth: 150,
            //     minWidth: 110,
            // },
            // {
            //     id:'montovehiculo' , name:'Monto Vehiculo' , field:'montovehiculo',
            //     sortable: true,
            //     type: FieldType.string,
            //     maxWidth: 150,
            //     minWidth: 110,
            // },
            // {
            //     id:'importe' , name:'Importe' , field:'importe',
            //     sortable: true,
            //     type: FieldType.string,
            //     maxWidth: 150,
            //     minWidth: 110,
            // },
            {
                id:'estado' , name:'Estado' , field:'estado',
                sortable: true,
                type: FieldType.string,
                maxWidth: 90,
                minWidth: 70,
            },
        ]

        this.gridOptionsLista = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    }
    ngAfterViewInit(): void {
    }

    async angularGridReadyLista(angularGrid: any) {
        this.angularGridLista = angularGrid.detail
        //this.gridObjEdit = angularGrid.detail.slickGrid;

        if (this.apiService.isMobile())
            this.angularGridLista.gridService.hideColumnByIds([])
    }

    async clienteChange(result: any): Promise<void> {
        console.log('result',result);
        this.clienteId = result
        // this.personalMap()
        // this.addMoreGroup = true
    }

    async onChangeDateI(result: Date){
        console.log('Selected Time: ', result);
        this.fechaInicial = result;
    }

    async onChangeDateF(result: Date){
        console.log('Selected Time: ', result);
        this.fechaFinal = result;
    }

}