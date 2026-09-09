import { Component, effect, viewChild, computed, input, model, signal, inject, resource } from '@angular/core';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { map, firstValueFrom } from 'rxjs';
import { Selections } from '../../../shared/schemas/filtro';
import { ApiService } from '../../../services/api.service';
import { AngularGridInstance, AngularUtilService, Column, GridOption, SlickGrid } from 'angular-slickgrid';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { toSignal } from '@angular/core/rxjs-interop';
import { columnTotal, totalRecords } from '../../../shared/custom-search/custom-search';
import { FiltroBuilderComponent } from '../../../shared/filtro-builder/filtro-builder.component';
import { Router } from '@angular/router';
import { LoadingService } from '@delon/abc/loading';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TableINAESRecibosComponent } from '../table-inaes-recibos/table-inaes-recibos'
import { ExternalResource } from '@slickgrid-universal/common';
import { InaesReg756_2025AltaCsvExportService } from '../../../services/inaes756-2025alta.export';
import { InaesReg756_2025BajaCsvExportService } from '../../../services/inaes756-2025baja.export';
import { InaesReg1000_21AltaCsvExportService } from '../../../services/inaes1000-21alta.export';
import { InaesReg1000_21BajaCsvExportService } from '../../../services/inaes1000-21baja.export';
// icons
// import { NzIconModule, provideNzIconsPatch } from 'ng-zorro-antd/icon';
// import { FileExcelFill } from '@ant-design/icons-angular/icons';


@Component({
    selector: 'app-inaes',
    templateUrl: './inaes.html',
    styleUrl: './inaes.less',
    // encapsulation: ViewEncapsulation.None,
    imports: [SHARED_IMPORTS, FiltroBuilderComponent, TableINAESRecibosComponent],
    providers: [AngularUtilService,] 
    
})
export class INAESComponent {
  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  gridDataImport = signal<any[]>([]);
  detailViewRowCount = 1;
  excelExportService = new ExcelExportService();
  listOptions = signal<listOptionsT>({
    filtros: [],
    sort: null,
  });
  loadingExport = signal<boolean>(false)
  startFilters = signal<Selections[]>([])
  tabIndex = signal<number>(0)
  hiddenColumnIds: string[] = [];
  columnsId: string[] = [];

  readonly router = inject(Router)
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)
  private readonly loadingSrv = inject(LoadingService)
  private notification = inject(NzNotificationService)
  private reg1000_21AltaExportService: ExternalResource | InaesReg1000_21AltaCsvExportService = new InaesReg1000_21AltaCsvExportService();
  private reg1000_21BajaExportService: ExternalResource | InaesReg1000_21BajaCsvExportService = new InaesReg1000_21BajaCsvExportService();
  private reg756_2025AltaExportService: ExternalResource | InaesReg756_2025AltaCsvExportService = new InaesReg756_2025AltaCsvExportService();
  private reg756_2025BajaExportService: ExternalResource | InaesReg756_2025BajaCsvExportService = new InaesReg756_2025BajaCsvExportService();

  columns = toSignal(this.apiService.getCols('/api/inaes/altas-bajas/cols')
    .pipe(map((cols) => {
      // Guardar IDs de columnas que tienen showGridColumn: false
      this.hiddenColumnIds = cols
        .filter((col: any) => col.showGridColumn === false)
        .map((col: Column) => col.id as string);
      this.columnsId = cols.map((col: Column) => col.id as string);
      
      return cols;
    })), { initialValue: [] as Column[] })

  gridData = resource({
    params: () => ({ options: this.listOptions() }),
    loader: async ({ params }) => {
      let response = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        response = await firstValueFrom(this.apiService.getINAESAltasBajas({ options: params.options })
        .pipe(map(data => { return data })));
      } catch (error) {
        
      }
      
      this.loadingSrv.close()
      return response || [];
    },
    defaultValue: []
  });

  async ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.enableAutoSizeColumns = true
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    // this.gridOptions.enableCheckboxSelector = true
    this.gridOptions.forceFitColumns = true
    this.gridOptions.enableExcelExport = true
    
    //Habilitando exportación de .CSV
    this.gridOptions.textExportOptions = { exportWithFormatter: true }
    this.gridOptions.externalResources!.push(
      this.reg1000_21AltaExportService as ExternalResource,
      this.reg1000_21BajaExportService as ExternalResource,
      this.reg756_2025AltaExportService as ExternalResource,
      this.reg756_2025BajaExportService as ExternalResource
    );
  }

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      totalRecords(this.angularGrid)
      columnTotal('CapitalSuscripto', this.angularGrid)
      columnTotal('CapitalIntegrado', this.angularGrid)
    })

    // Ocultar columnas basadas en la propiedad showGridColumn de cada columna
    if (this.hiddenColumnIds.length > 0) {
      this.angularGrid.gridService.hideColumnByIds(this.hiddenColumnIds)
    }

    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  //Configuración de cada exportación: estado a filtrar y textos para los mensajes
  private readonly exportaciones: Record<string, { Estado: string, movimiento: string, resolucion: string }> = {
    'altas1000-21': { Estado: 'A', movimiento: 'altas', resolucion: 'Res. 1000/21' },
    'bajas1000-21': { Estado: 'B', movimiento: 'bajas', resolucion: 'Res. 1000/21' },
    'altas756-2025': { Estado: 'A', movimiento: 'altas', resolucion: 'Res. 756/2025' },
    'bajas756-2025': { Estado: 'B', movimiento: 'bajas', resolucion: 'Res. 756/2025' },
  }

  async exportXlsxGrid(filter:string) {
    this.loadingExport.set(true)
    try {
      //Configuro el filtro
      const exportacion = this.exportaciones[filter]
      if (!exportacion) {
        throw new ExportError(`No se pudo exportar: el tipo de exportación "${filter}" no es válido.`);
      }
      const { Estado, movimiento, resolucion } = exportacion
      const detalle = `${movimiento} para ${resolucion}`

      const saveData:any[] = this.gridData.value()
      //Filtro los datos
      let dataExport:any[] = await this.gridData.value().filter(
        (row: any) => (row.Estado === Estado)
      )

      if (!dataExport.length) {
        // const conflictivos = saveData.filter((row: any) => row.Estado === 'E').length
        throw new ExportError(`No se encontraron ${detalle} para exportar con los filtros aplicados.`)
        // if (conflictivos)
        //   msg += ` Hay ${conflictivos} registro(s) en estado ERROR que deben corregirse.`

        // this.notification.warning(`Advertencia`, msg);
        // this.loadingExport.set(false)
        // return
      }
      
      //Muestro solo las columnas que se van a exportar
      if (this.hiddenColumnIds.length > 0) 
        this.angularGrid.gridService.showColumnByIds(this.columnsId)

      //------ Validaciones ------
      //Campos vacios
      const emptyFields = this.getEmptyFields()
      if (emptyFields.length) {
        let errorMsg = `No se puede exportar ${detalle}: hay ${emptyFields.length} registro(s) con campos vacíos.\n`

        errorMsg += emptyFields.map((x:any) => { return `[Fila ${x.row + 1}] ${this.gridData.value()[x.row].ApellidoNombre}: ${x.names.join(", ")}.`}).join('\n');
        // this.notification.warning(`Advertencia`, errorMsg);
        throw new ExportError(errorMsg)
      }
    

      if (Estado == 'A') {
        await (this.reg1000_21AltaExportService as InaesReg1000_21AltaCsvExportService).exportToExcel({
          filename: `INAES-${filter}`,
          format: 'xlsx',
        });
      } else if (Estado == 'B') {
        await (this.reg1000_21BajaExportService as InaesReg1000_21BajaCsvExportService).exportToExcel({
          filename: `INAES-${filter}`,
          format: 'xlsx',
        });
      }
      // await this.excelExportService.exportToExcel({
      //   filename: `INAES-${filter}`,
      //   format: 'xlsx',
      // });

    } catch (error) {
      if (error instanceof ExportError) {
        this.notification.warning('Advertencia', error.message);
      } else console.log('error: ', error);
      
    }
    
    // Ocultar columnas basadas en la propiedad showGridColumn de cada columna
    if (this.hiddenColumnIds.length > 0)
      this.angularGrid.gridService.hideColumnByIds(this.hiddenColumnIds)
    
    this.loadingExport.set(false)
  }

  getEmptyFields():{ row: number, fields: string[], names: string[] }[] {

    const result: { row: number, fields: string[], names: string[] }[] = [];
    
    this.gridData.value().forEach((item:any, index:number) => {
      let fields:string[] = []
      let names:string[] = []
      this.columns().forEach((column:any) => {
        if (column.excludeFromExport) return //Excluir las columnas que no se van a exportan
        const value = item[column.field];

        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')){
          fields.push(column.field)
          names.push(column.name)
        }
          
      });
      if (names.length > 0)
        result.push({ row: index, fields, names });
    });

    return result;
  }

  async exportCsvGrid(filter:string) {
    this.loadingExport.set(true)
    try {
      //Configuro el filtro
      const exportacion = this.exportaciones[filter]
      if (!exportacion) {
        throw new ExportError(`No se pudo exportar: el tipo de exportación "${filter}" no es válido.`);
      }
      const { Estado, movimiento, resolucion } = exportacion
      const detalle = `${movimiento} para ${resolucion}`

      //Filtro los datos
      let dataExport:any[] = await this.gridData.value().filter(
        (row: any) => (row.Estado === Estado)
      )

      if (!dataExport.length) {
        // const conflictivos = saveData.filter((row: any) => row.Estado === 'E').length
        let msg = `No se encontraron ${detalle} para exportar con los filtros aplicados.`
        // if (conflictivos)
        //   msg += ` Hay ${conflictivos} registro(s) en estado ERROR que deben corregirse.`
        throw new ExportError(msg)
      }
      //Muestro solo las columnas que se van a exportar
      if (this.hiddenColumnIds.length > 0) 
        this.angularGrid.gridService.showColumnByIds(this.columnsId)
      
      //------ Validaciones ------
      // Campos vacios
      const emptyFields = this.getEmptyFields()
      if (emptyFields.length) {
        let errorMsg = `No se puede exportar ${detalle}: hay ${emptyFields.length} registro(s) con campos vacíos.\n`
        errorMsg += emptyFields.map((x:any) => { return `[Fila ${x.row + 1}] ${this.gridData.value()[x.row].ApellidoNombre}: ${x.names.join(", ")}.`}).join('\n');
        throw new ExportError(errorMsg);
      }
      
      if (Estado == 'A') {
        await (this.reg756_2025AltaExportService as InaesReg756_2025AltaCsvExportService).exportToFile({
          delimiter: ';',
          filename: `INAES-${filter}`,
          format: 'csv',
        });
      } else if (Estado == 'B') {
        await (this.reg756_2025BajaExportService as InaesReg756_2025BajaCsvExportService).exportToFile({
          delimiter: ';',
          filename: `INAES-${filter}`,
          format: 'csv',
        });
      }
    } catch (error) {
      if (error instanceof ExportError) {
        this.notification.warning('Advertencia', error.message);
      }
    }
    // Ocultar columnas basadas en la propiedad showGridColumn de cada columna
    if (this.hiddenColumnIds.length > 0)
      this.angularGrid.gridService.hideColumnByIds(this.hiddenColumnIds)
    
    this.loadingExport.set(false)
  }
}

class ExportError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'ExportError';
  }
}