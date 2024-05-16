import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS } from '@shared';
// import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { firstValueFrom } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';

@Component({
    selector: 'app-custodias',
    templateUrl: './custodias.component.html',
    styleUrls: ['./custodias.component.less'],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule, PersonalSearchComponent, ClienteSearchComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,

})
export class CustodiaComponent {
    ngForm = viewChild.required(NgForm);
    public router = inject(Router);
    public route = inject(ActivatedRoute);

    angularGrid!: AngularGridInstance;
    gridOptions!: GridOption;
    gridDataInsert: any[] = [];
    agregarPersonal = false
    columnas: Column[] = [];
    detailViewRowCount = 1;
    excelExportService = new ExcelExportService()

    listInputPersonal: Array<{ id: number }> = [];
    listInputVehiculo: Array<{ id: number }> = [];

    private angularUtilService = inject(AngularUtilService)
    private searchService = inject(SearchService)
    public apiService = inject(ApiService)

    async ngOnInit(){
        this.columnas = [
            // {
            //     id:'responsable' , name:'Responsable' , field:'responsable',
            //     sortable: true,
            //     type: FieldType.string,
            //     maxWidth: 100,
            //     minWidth: 150,
            // },
            {
                id:'cliente' , name:'Cliente' , field:'cliente',
                sortable: true,
                type: FieldType.string,
                formatter: Formatters.complexObject,
                params: {
                    complexFieldLabel: 'cliente.fullName',
                },
                // maxWidth: 170,
                minWidth: 140,
            },
            {
                id:'descripcion' , name:'Descripcion' , field:'descripcion',
                sortable: true,
                type: FieldType.text,
                // maxWidth: 300,
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
                // maxWidth: 180,
                minWidth: 140,
            },
            {
                id:'fechaF' , name:'Fecha Final' , field:'fechaF',
                sortable: true,
                type: FieldType.dateTimeShortUs,
                maxWidth: 150,
                minWidth: 110,
            },
            {
                id:'destino' , name:'Destino' , field:'destino',
                sortable: true,
                type: FieldType.string,
                // maxWidth: 180,
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
                formatter: Formatters.complexObject,
                params: {
                    complexFieldLabel: 'estado.descripcion',
                },
                maxWidth: 180,
                minWidth: 130,
            },
        ]

        this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    }
    ngAfterViewInit(): void {
    }

    async angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid.detail
        //this.gridObjEdit = angularGrid.detail.slickGrid;

        if (this.apiService.isMobile())
            this.angularGrid.gridService.hideColumnByIds([])
    }

    async save() {
        console.log('graba',this.ngForm().value)
        const res = await firstValueFrom(this.apiService.addObjetivoCustodia(this.ngForm().value))
    }

    addPersonal(e?: MouseEvent): void {
        e?.preventDefault();
        const id = this.listInputPersonal.length > 0 ? this.listInputPersonal[this.listInputPersonal.length - 1].id + 1 : 0;
        const control = {
            id,
        };
        this.listInputPersonal.push(control);
        // console.log(this.listInputPersonal[this.listInputPersonal.length - 1]);
    }

    addVehiculo(e?: MouseEvent): void {
        e?.preventDefault();
        const id = this.listInputVehiculo.length > 0 ? this.listInputVehiculo[this.listInputVehiculo.length - 1].id + 1 : 0;
        const control = {
            id,
        };
        this.listInputVehiculo.push(control);
        // console.log(this.listInputVehiculo[this.listInputVehiculo.length - 1]);
    }

    removePersonal(i: { id: number }, e: MouseEvent): void {
        e.preventDefault();
        if (this.listInputPersonal.length > 1) {
            const index = this.listInputPersonal.indexOf(i);
            this.listInputPersonal.splice(index, 1);
            // console.log(this.listInputPersonal);
        }
    }

    removeVehiculo(i: { id: number }, e: MouseEvent): void {
        e.preventDefault();
        if (this.listInputPersonal.length > 1) {
            const index = this.listInputPersonal.indexOf(i);
            this.listInputPersonal.splice(index, 1);
            // console.log(this.listInputPersonal);
        }
    }

}