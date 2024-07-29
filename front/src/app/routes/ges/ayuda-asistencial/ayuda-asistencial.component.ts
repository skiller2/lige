import { Component, Injector, viewChild, inject } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS,listOptionsT } from '@shared';
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

@Component({
    selector: 'app-ayuda-asistencial',
    templateUrl: './ayuda-asistencial.component.html',
    styleUrls: ['./ayuda-asistencial.component.less'],
    standalone: true,
    providers: [AngularUtilService, ExcelExportService],
    imports: [...SHARED_IMPORTS, FiltroBuilderComponent, CommonModule, PersonalSearchComponent, ViewResponsableComponent]
})
export class AyudaAsistencialComponent {
    formAsist = viewChild.required(NgForm)
    selectedPeriod = { year: 0, month: 0 };
    angularGrid!: AngularGridInstance;
    gridOptions!: GridOption;
    gridObj!: SlickGrid;
    excelExportService = new ExcelExportService()
    detailViewRowCount = 1
    startFilters: { field: string; condition: string; operator: string; value: string; forced:boolean}[]=[]
    listOptions: listOptionsT = { filtros: [], sort: null, };

    formChange$ = new BehaviorSubject('');
    tableLoading$ = new BehaviorSubject(false);

    private apiService = inject(ApiService)
    private searchService = inject(SearchService)
    private angularUtilService = inject(AngularUtilService)
    private settingService = inject(SettingsService)

    columns$ = this.apiService.getCols('/api/ayuda-asistencial/cols')

    gridData$ = this.formChange$.pipe(
        debounceTime(500),
        switchMap(() => {
            return this.searchService.getPersonasAyudaAsistencial(
                { anio: this.selectedPeriod.year, mes: this.selectedPeriod.month, options: this.listOptions }
            )
            .pipe(
                map(data => { return data }),
                doOnSubscribe(() => this.tableLoading$.next(true)),
                tap({ complete: () => this.tableLoading$.next(false) })
            )
        })
    )

    async ngOnInit() {
        this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
        this.gridOptions.enableRowDetailView = false
        this.gridOptions.autoEdit = true
        this.gridOptions.showFooterRow = true
        this.gridOptions.createFooterRow = true  
    }

    ngAfterViewInit(): void {
        const now = new Date();
        setTimeout(() => {
            const anio = Number(localStorage.getItem('anio')) > 0  ? Number(localStorage.getItem('anio')) : now.getFullYear();
            const mes = Number(localStorage.getItem('mes')) > 0 ? Number(localStorage.getItem('mes')) : now.getMonth() + 1;
            this.selectedPeriod.year = anio
            this.selectedPeriod.month = mes
            this.formAsist().form.get('periodo')?.setValue(new Date(anio, mes - 1, 1));
        }, 1);
    }

    ngAfterContentInit(): void {
        const user: any = this.settingService.getUser()
        const gruposActividadList = user.GrupoActividad
        setTimeout(() => {
            if (gruposActividadList.length > 0)
              this.startFilters.push({ field: 'GrupoActividadNumero', condition: 'AND', operator: '=', value: gruposActividadList.join(';'), forced: false })
        }, 1500);
    }

    async angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid.detail
        this.gridObj = angularGrid.detail.slickGrid;
        
        this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
          totalRecords(this.angularGrid)
        })
        
    }

    dateChange(result: Date): void {
        this.selectedPeriod.year = result.getFullYear();
        this.selectedPeriod.month = result.getMonth() + 1;
    
        localStorage.setItem('anio', String(this.selectedPeriod.year));
        localStorage.setItem('mes', String(this.selectedPeriod.month));
    
        this.formChange('');
    }

    formChange(event: any) {
        this.formChange$.next(event);
    }
}