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
import { firstValueFrom, map } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';


@Component({
    selector: 'app-custodias',
    templateUrl: './custodias.component.html',
    styleUrls: ['./custodias.component.less'],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [SHARED_IMPORTS, CommonModule, PersonalSearchComponent, ClienteSearchComponent, DetallePersonaComponent],
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
    detailViewRowCount = 1;
    editCustodiaId = 0;
    excelExportService = new ExcelExportService()
    visibleDrawer: boolean = false
    periodo = signal({ year: 0, month: 0 });
    personalId = signal(0);

    cantInputs : Array<number> = [1,2,3,4,5]
    listInputPersonal: Array<number> = this.cantInputs.slice();
    listInputVehiculo: Array<number> = this.cantInputs.slice();

    private angularUtilService = inject(AngularUtilService)
    private searchService = inject(SearchService)
    public apiService = inject(ApiService)

    columns$ = this.apiService.getColumnsCustodia().pipe(map((cols) => {
        let mapped = cols.map((col:any) => {
            let item = col
            if(col.type)
                item = {...item, type : FieldType[col.type as keyof typeof FieldType]}
            if(col.formatter = 'complexObject')
                item = {...item, formatter: Formatters.complexObject}
            return item
        });
        // console.log('mapped', mapped);
        return mapped
      }));

    async ngOnInit(){
        this.gridOptions = this.apiService.getDefaultGridOptions('.gridListContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptions.enableRowDetailView = false
        this.gridOptions.editable = false
        this.gridOptions.autoEdit = true
        this.gridOptions.enableAutoSizeColumns = true
        this.gridOptions.fullWidthRows = true
        this.gridOptions.enableExcelExport = false
        this.gridDataInsert = await firstValueFrom(this.searchService.getListaObjetivoCustodia())
        // console.log('this.gridDataInsert', this.gridDataInsert);
    }

    ngAfterViewInit(): void {
    }

    async angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid.detail

        if (this.apiService.isMobile())
            this.angularGrid.gridService.hideColumnByIds([])
    }

    async save() {
        // console.log('editCustodiaId',this.editCustodiaId)
        console.log('graba',this.ngForm().value)
        if (this.editCustodiaId) {
            const res = await firstValueFrom(this.apiService.updateObjCustodia(this.ngForm().value, this.editCustodiaId))
        } else {
            const res = await firstValueFrom(this.apiService.addObjCustodia(this.ngForm().value))
        }
        this.gridDataInsert = await firstValueFrom(this.searchService.getListaObjetivoCustodia())
        // this.ngForm().onReset()
    }

    async setEstado(estado:number) {
        if (this.editCustodiaId) {
            let form = this.ngForm().value
            form.estado = estado
            const res = await firstValueFrom(this.apiService.updateObjCustodia(form, this.editCustodiaId))
            this.gridDataInsert = await firstValueFrom(this.searchService.getListaObjetivoCustodia())
        }
    }

    addPersonal(e?: MouseEvent): void {
        e?.preventDefault();
        const id = this.listInputPersonal.length > 0 ? this.listInputPersonal[this.listInputPersonal.length - 1] + 1 : 0;
        this.listInputPersonal.push(id);
    }

    addVehiculo(e?: MouseEvent): void {
        e?.preventDefault();
        const id = this.listInputVehiculo.length > 0 ? this.listInputVehiculo[this.listInputVehiculo.length - 1] + 1 : 0;
        this.listInputVehiculo.push(id);
    }

    removePersonal(i: number, e: MouseEvent): void {
        e.preventDefault();
        if (this.listInputPersonal.length > 1) {
            const index = this.listInputPersonal.indexOf(i);
            this.listInputPersonal.splice(index, 1);
        }
    }

    removeVehiculo(i: number, e: MouseEvent): void {
        e.preventDefault();
        if (this.listInputVehiculo.length > 1) {
            const index = this.listInputVehiculo.indexOf(i);
            this.listInputVehiculo.splice(index, 1);
        }
    }

    handleSelectedRowsChanged(): void {
        const selrows = this.angularGrid.slickGrid.getSelectedRows()
        if (selrows[0] == undefined) return
        const row = this.angularGrid.slickGrid.getDataItem(selrows[0])
        if (row.id == undefined) return
        if (row.estado.tipo) return
        this.editCustodiaId = row.id
        // console.log('editCustodiaId', this.editCustodiaId);
    }

    resetObjCustodiaId(): void {
        this.editCustodiaId = 0
        this.ngForm().reset()
        this.listInputPersonal = [1]
        this.listInputVehiculo = [1]
        this.periodo.set({ year: 0, month: 0 })
    }

    resetForm(): void {
        this.editCustodiaId = 0
        this.listInputPersonal = this.cantInputs.slice()
        this.listInputVehiculo = this.cantInputs.slice()
        this.ngForm().reset()
    }

    async getObjCustodiaId(){
        // console.log('graba',this.ngForm().value)
        const res = await firstValueFrom(this.searchService.getInfoObjCustodia(this.editCustodiaId))
        // console.log('res', res);
        res.form.fechaInicio = new Date(res.form.fechaInicio)
        if(res.form.fechaFinal)
            res.form.fechaFinal = new Date(res.form.fechaFinal)
        this.listInputPersonal = res.personalLength
        this.listInputVehiculo = res.vehiculoLength
        this.ngForm().reset(res.form)
    }

    openDrawer(key:any): void {
        const personalId = this.ngForm().value[key]
        if (!personalId) return
        this.personalId.set(personalId)
        this.visibleDrawer = true
        // console.log('personalId', personalId);
        // console.log('this.periodo().year', this.periodo().year);
        // console.log('this.periodo().month', this.periodo().month);
    }

    closeDrawer(): void {
        this.visibleDrawer = false;
        this.personalId.set(0)
    }

    onChangePeriodo(result: Date): void {
        if (result) {
            const year = result.getFullYear()
            const month = result.getMonth()+1
            this.periodo.set({ year, month })
        }
    }

}