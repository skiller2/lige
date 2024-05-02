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
import { EditorClienteComponent } from '../../../shared/editor-cliente/editor-cliente.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { FechaHoraSelectComponent } from '../../../shared/fecha-hora-select/fecha-hora-select.component';

@Component({
    selector: 'app-custodias',
    templateUrl: './custodias.component.html',
    styleUrls: ['./custodias.component.less'],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, ClienteSearchComponent, CommonModule, PersonalSearchComponent]
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
    personalCarga = [{title: 'Agregar'},];
    agregarPersonal = false
    columnasLista: Column[] = [];
    columnasCarga: Column[] = [];
    detailViewRowCount = 1;
    excelExportService = new ExcelExportService()
    responsable = { id: 0, fullName: ''}
    
    loading = false;

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
            {
                id:'montopersonal' , name:'Monto Personal' , field:'montopersonal',
                sortable: true,
                type: FieldType.string,
                maxWidth: 150,
                minWidth: 110,
            },
            {
                id:'montovehiculo' , name:'Monto Vehiculo' , field:'montovehiculo',
                sortable: true,
                type: FieldType.string,
                maxWidth: 150,
                minWidth: 110,
            },
            {
                id:'importe' , name:'Importe' , field:'importe',
                sortable: true,
                type: FieldType.string,
                maxWidth: 150,
                minWidth: 110,
            },
            {
                id:'estado' , name:'Estado' , field:'estado',
                sortable: true,
                type: FieldType.string,
                maxWidth: 90,
                minWidth: 70,
            },
        ]

        this.columnasCarga = [
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
                formatter: Formatters.complexObject,
                exportWithFormatter: true,
                params: {
                    complexFieldLabel: 'cliente.fullName',
                },
                editor: {
                    model: CustomInputEditor,
                    collection: [],
                    params: {
                        component: EditorClienteComponent,
                    },
                    alwaysSaveOnEnterKey: true,
                    // required: true
                },
            },
            {
                id:'descripcion' , name:'Descripcion' , field:'descripcion',
                sortable: true,
                type: FieldType.text,
                maxWidth: 300,
                minWidth: 230,
                editor: {
                    model: Editors.longText,
                    alwaysSaveOnEnterKey: true,
                    // required: true
                },
            },
            {
                id:'fechaI' , name:'Fecha Inicio' , field:'fechaI',
                sortable: true,
                type: FieldType.dateTimeShortUs,
                maxWidth: 150,
                minWidth: 110,
                params: {
                    complexFieldLabel: 'fechaI.date',
                    complexField: 'fechaI.date',
                },
                editor: {
                    model: CustomInputEditor,
                    collection: [],
                    params: {
                        component: FechaHoraSelectComponent,
                    },
                    alwaysSaveOnEnterKey: true,
                    // required: true
                },
            },
            {
                id:'origen' , name:'Origen' , field:'origen',
                sortable: true,
                type: FieldType.string,
                maxWidth: 180,
                minWidth: 140,
                editor: {
                    model: Editors.text
                }
            },
            {
                id:'fechaF' , name:'Fecha Final' , field:'fechaB',
                sortable: true,
                type: FieldType.dateTimeShortUs,
                maxWidth: 150,
                minWidth: 110,
                params: {
                    complexFieldLabel: 'fechaF.date',
                    complexField: 'fechaF.date',
                },
                editor: {
                    model: CustomInputEditor,
                    collection: [],
                    params: {
                        component: FechaHoraSelectComponent,
                    },
                    alwaysSaveOnEnterKey: true,
                    // required: true
                },
            },
            {
                id:'destino' , name:'Destino' , field:'destino',
                sortable: true,
                type: FieldType.string,
                maxWidth: 180,
                minWidth: 140,
                editor: {
                    model: Editors.text
                }
            },
            {
                id:'montopersonal' , name:'Monto Personal' , field:'montopersonal',
                sortable: true,
                type: FieldType.float,
                maxWidth: 150,
                minWidth: 110,
                formatter: Formatters.multiple,
                params: { formatters: [Formatters.currency] },
                editor: {
                    model: Editors.float, decimal: 2, valueStep: 1, minValue: 0, maxValue: 100000000,
                },
                cssClass: 'text-right',
            },
            {
                id:'montovehiculo' , name:'Monto Vehiculo' , field:'montovehiculo',
                sortable: true,
                type: FieldType.float,
                maxWidth: 150,
                minWidth: 110,
                formatter: Formatters.multiple,
                params: { formatters: [Formatters.currency] },
                editor: {
                    model: Editors.float, decimal: 2, valueStep: 1, minValue: 0, maxValue: 100000000,
                },
                cssClass: 'text-right',
            },
            {
                id:'importe' , name:'Importe' , field:'importe',
                sortable: true,
                type: FieldType.float,
                maxWidth: 150,
                minWidth: 110,
                formatter: Formatters.multiple,
                params: { formatters: [Formatters.currency] },
                editor: {
                    model: Editors.float, decimal: 2, valueStep: 1, minValue: 0, maxValue: 100000000,
                }
            },
            {
                id:'estado' , name:'Estado' , field:'estado',
                sortable: true,
                type: FieldType.string,
                maxWidth: 90,
                minWidth: 70,
                cssClass: 'text-center',
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
        this.gridOptionsCarga.editable = true
        this.gridOptionsCarga.enableCellNavigation = true

        this.gridOptionsCarga.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {
            //            let undoCommandArr:EditCommand[]=[]
            this.angularGridCarga.dataView.getItemMetadata = this.updateItemMetadata(this.angularGridCarga.dataView.getItemMetadata)
            this.angularGridCarga.slickGrid.invalidate();

            const emptyrows = this.angularGridCarga.dataView.getItems().filter(row => (!row.cliente.id))

            if (emptyrows.length == 0) {
                this.addNewItem("bottom")
            } else if (emptyrows.length > 1) {
                this.angularGridCarga.gridService.deleteItemById(emptyrows[0].id)
            }
        }
    }
    ngAfterViewInit(): void {
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

    updateItemMetadata(previousItemMetadata: any) {
        return (rowNumber: number) => {
            const item = this.angularGridCarga.dataView.getItem(rowNumber)
            let meta = { cssClasses: '' }

            if (typeof previousItemMetadata === 'object')
                meta = previousItemMetadata(rowNumber)

            return meta
        }
    }

    addNewItem(insertPosition?: 'bottom') {
        const newItem1 = this.createNewItem(1);
        this.angularGridCarga.gridService.addItem(newItem1, { position: insertPosition, highlightRow: false, scrollRowIntoView: false, triggerEvent: false });
        // console.log('this.gridDataInsertCarga',this.gridDataInsertCarga);
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
            responsable:'',
            cliente: '',
            descripcion: '',
            fechaA: '',
            origen:'',
            fechaB: '',
            destino:'',
            estado: 0
        };
    }

    setAgregarPersonal() {
        this.agregarPersonal = !this.agregarPersonal
    }
}