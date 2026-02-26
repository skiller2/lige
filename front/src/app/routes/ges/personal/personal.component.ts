import { Component, Injector, viewChild, inject, signal, model, computed, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, GridOption, SlickGrid } from 'angular-slickgrid';
import { columnTotal, totalRecords } from 'src/app/shared/custom-search/custom-search';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';
import { PersonalFormComponent } from '../personal-form/personal-form.component';
import { LicenciaHistorialDrawerComponent } from '../licencia-historial-drawer/licencia-historial-drawer.component'
import { PersonalObjetivoDrawerComponent } from '../personal-objetivo-drawer/personal-objetivo-drawer.component'
import { PersonalCustodiasDrawerComponent } from '../personal-custodias-drawer/personal-custodias-drawer.component'
import { PersonalDomicilioDrawerComponent } from '../personal-domicilio-drawer/personal-domicilio-drawer.component'
import { PersonalSituacionRevistaDrawerComponent } from '../personal-situacionrevista-drawer/personal-situacionrevista-drawer.component'
import { PersonalResponsableDrawerComponent } from '../personal-responsable-drawer/personal-responsable-drawer.component'
import { PersonalDocumentosDrawerComponent } from '../personal-documentos-drawer/personal-documentos-drawer.component'
import { PersonalCategoriaDrawerComponent } from '../personal-categoria-drawer/personal-categoria-drawer.component'
import { PersonalBancoDrawerComponent } from '../personal-banco-drawer/personal-banco-drawer.component'
import { PersonalActaDrawerComponent } from '../personal-acta-drawer/personal-acta-drawer.component'
import { DetallePersonaComponent } from "../detalle-persona/detalle-persona.component";
import { ActivatedRoute, Router } from '@angular/router';

// icons
import { NzIconModule, provideNzIconsPatch } from 'ng-zorro-antd/icon';
import { TagOutline, ClockCircleOutline, BankOutline, CarOutline, EnvironmentOutline, HomeOutline, EyeOutline, ContainerOutline } from '@ant-design/icons-angular/icons';
import { Selections } from 'src/app/shared/schemas/filtro';


@Component({
  selector: 'app-personal',
  templateUrl: './personal.component.html',
  styleUrl: './personal.component.less',
  // encapsulation: ViewEncapsulation.None,
  imports: [...SHARED_IMPORTS, FiltroBuilderComponent, CommonModule, NzIconModule,
    PersonalFormComponent, LicenciaHistorialDrawerComponent,
    PersonalObjetivoDrawerComponent, PersonalCustodiasDrawerComponent, PersonalDomicilioDrawerComponent,
    PersonalSituacionRevistaDrawerComponent, PersonalResponsableDrawerComponent, PersonalDocumentosDrawerComponent,
    DetallePersonaComponent, PersonalCategoriaDrawerComponent, PersonalBancoDrawerComponent, PersonalActaDrawerComponent
  ],
  providers: [AngularUtilService, ExcelExportService, provideNzIconsPatch([TagOutline, ClockCircleOutline, BankOutline, CarOutline, EnvironmentOutline, HomeOutline, EyeOutline, ContainerOutline])],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PersonalComponent {
  public router = inject(Router);
  public route = inject(ActivatedRoute);

  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  gridDataInsert: any[] = [];
  detailViewRowCount = 1;
  excelExportService = new ExcelExportService();
  listPersonal$ = new BehaviorSubject('');
  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };
  startFilters = signal<Selections[]>([])

  private angularUtilService = inject(AngularUtilService)
  private searchService = inject(SearchService)
  private apiService = inject(ApiService)

  personalId = signal(0)
  anio = signal(0)
  mes = signal(0)
  visibleHistorial = model<boolean>(false)
  visibleObjetivo = model<boolean>(false)
  visibleCustodias = model<boolean>(false)
  visibleDomicilio = model<boolean>(false)
  visibleSitRevista = model<boolean>(false)
  visibleResponsable = model<boolean>(false)
  visibleDocumentos = model<boolean>(false)
  visibleDetalle = model<boolean>(false)
  visibleCategoria = model<boolean>(false)
  visibleBanco = model<boolean>(false)
  visibleActa = model<boolean>(false)
  hiddenColumnIds: string[] = [];



  // childLicHistDrawer = viewChild.required<PersonalObjetivoDrawerComponent>('licHistDrawer')
  // childObjDrawer = viewChild.required<PersonalObjetivoDrawerComponent>('objDrawer')
  // childCustDrawer = viewChild.required<PersonalCustodiasDrawerComponent>('custDrawer')
  // childDomDrawer = viewChild.required<PersonalDomicilioDrawerComponent>('domDrawer')
  childPerFormDrawer = viewChild.required<PersonalFormComponent>('perForm')
  childPerDetalleDrawer = viewChild.required<PersonalFormComponent>('perDetalle')
  childPerDocumentosDrawer = viewChild.required<PersonalDocumentosDrawerComponent>('docDrawer')

  columns$ = this.apiService.getCols('/api/personal/cols').pipe(
    map((cols) => {
      // Guardar IDs de columnas que tienen showGridColumn: false
      this.hiddenColumnIds = cols
        .filter((col: any) => col.showGridColumn === false)
        .map((col: Column) => col.id as string);
      return cols;
    })
  )
  gridData$ = this.listPersonal$.pipe(
    debounceTime(500),

    switchMap(() => {
      return this.searchService.getPersonalList({ options: this.listOptions })
        .pipe(map(data => { return data }))
    })
  )

  async ngOnInit() {
    const date: Date = new Date()
    this.anio.set(date.getFullYear())
    this.mes.set(date.getMonth() + 1)
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.enableAutoSizeColumns = true
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    this.gridOptions.enableCheckboxSelector = true
    this.gridOptions.forceFitColumns = true

    this.startFilters.set([{ index: 'SituacionRevistaId', condition: 'AND', operator: '=', value: '2;10;12', closeable: true },
    ])
  }

  ngAfterViewInit(): void {
    
    const PersonalId = Number(this.route.snapshot.paramMap.get('PersonalId'))

    setTimeout(() => {
      if (PersonalId > 0) {
        this.startFilters.set([ {index:'ApellidoNombre', condition:'AND', operator:'=', value: String(PersonalId), closeable: true} ]);
      }
    }, 1000)
  }

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
    })

    // Ocultar columnas basadas en la propiedad showGridColumn de cada columna
    if (this.hiddenColumnIds.length > 0) {
      this.angularGrid.gridService.hideColumnByIds(this.hiddenColumnIds)
    }

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  handleSelectedRowsChanged(e: any): void {
    if (e.detail.args.changedSelectedRows.length == 1) {
      const rowNum = e.detail.args.changedSelectedRows[0]
      const PersonalId = this.angularGrid.dataView.getItemByIdx(rowNum)?.PersonalId
      this.personalId.set(PersonalId)

    } else {
      this.personalId.set(0)
    }
  }

  listOptionsChange(options: any) {
    this.listOptions = options;
    this.listPersonal$.next('');
  }

  getGridData(): void {
    this.listPersonal$.next('');
  }

  openDrawerforConsultHistory(): void {
    this.visibleHistorial.set(true)
  }

  openDrawerforConsultObjective(): void {
    this.visibleObjetivo.set(true)
  }

  openDrawerforConsultCustodias(): void {
    this.visibleCustodias.set(true)
  }

  openDrawerforConsultDomicilio(): void {
    this.visibleDomicilio.set(true)
  }

  openDrawerforConsultSitRevista(): void {
    this.visibleSitRevista.set(true)
  }

  openDrawerforConsultResponsable(): void {
    this.visibleResponsable.set(true)
  }

  openDrawerforConsultDocumentos(): void {
    this.visibleDocumentos.set(true)
    this.childPerDocumentosDrawer().resetFormValues()
  }

  openDrawerforConsultCategoria(): void {
    this.visibleCategoria.set(true)
  }

  openDrawerforConsultDetalle(): void {
    this.visibleDetalle.set(true)
  }

  openDrawerforConsultBanco(): void {
    this.visibleBanco.set(true)
  }

  closeDrawerforConsultDetalle(): void {
    this.visibleDetalle.set(false)
  }

  openDrawerforConsultActa(): void {
    this.visibleActa.set(true)
  }

  onTabsetChange(_event: any) {
    switch (_event.index) {
      case 4: //DETALLE
        this.childPerDetalleDrawer().load()
        break
      case 3: //EDIT
        this.childPerFormDrawer().load()
        break;
      case 2:
        break;
      default:
        break;
    }
  }

  async showPasswordDerivated() {
    
  }
}