import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, computed, resource } from '@angular/core';
import { AngularGridInstance, AngularUtilService, GridOption, Column, Editors, EditCommand, SlickGlobalEditorLock } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../../services/api.service';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, timer } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { SettingsService } from '@delon/theme';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"
import { ActasPersonalListadoComponent } from '../actas-personal-listado/actas-personal-listado';
import { LoadingService } from '@delon/abc/loading';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-actas',
  templateUrl: './actas.component.html',
  styleUrls: ['./actas.component.less'],
  encapsulation: ViewEncapsulation.None,
  providers: [AngularUtilService],
  imports: [SHARED_IMPORTS, CommonModule,
    FiltroBuilderComponent, 
    ActasPersonalListadoComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActasComponent {
  public router = inject(Router);
  public route = inject(ActivatedRoute);

  angularGrid!: AngularGridInstance;
  gridOptions!: GridOption;
  rows: number[] = [];
  detailViewRowCount = 1;
  excelExportService = new ExcelExportService();
  // listActas$ = new BehaviorSubject('');
  listOptions = signal<listOptionsT>({
      filtros: [],
      sort: null,
  })
  startFilters: any[] = []

  rowLocked = signal<boolean>(false);
  selectedActaId = signal<number>(0);
  selectedNroActa = signal<number>(0);

  private readonly loadingSrv = inject(LoadingService)
  private searchService = inject(SearchService)
  private apiService = inject(ApiService)
  private angularUtilService = inject(AngularUtilService)


  columns = toSignal(this.apiService.getCols('/api/actas/cols')
  .pipe(map((cols: Column<any>[]) => {
    let mapped = cols.map((col: Column) => {
      if (col.id == 'ActaNroActa') {
        // col.cssClass = 'text-right',
        col.editor = {
          model: Editors['integer'],
          minValue: 0,
          maxValue: 10000000,
          alwaysSaveOnEnterKey: true,
          //   required: true
      }
      }
      return col
    });
    return mapped
  })), { initialValue: [] as Column[] })
  
  gridData = resource({
    params: () => ({ options: this.listOptions() }),
    loader: async ({ params }) => {
      let response = []
      this.loadingSrv.open({ type: 'spin', text: '' })
      try {
        response = await firstValueFrom(this.apiService.getActas({ options: params.options })
        .pipe(map(data => {
          const newId = data.length + 1
          data.push({
            id: newId,
            ActaId: 0,
            ActaNroActa: "",
            ActaDescripcion: "",
            ActaFechaActa: "",
          })
          return data
        })));
      } catch (_e) { }
      this.loadingSrv.close()

      return response || [];
    },

    defaultValue: []
  });

  $optionsEstadoCust = this.searchService.getEstadoCustodia();

  itemAddActive = false

  async ngOnInit() {
    this.gridOptions = this.apiService.getDefaultGridOptions('.gridContainer', this.detailViewRowCount, this.excelExportService, this.angularUtilService, this, RowDetailViewComponent)
    this.gridOptions.enableRowDetailView = false
    this.gridOptions.enableAutoSizeColumns = true
    // this.gridOptions.fullWidthRows = true
    this.gridOptions.showFooterRow = true
    this.gridOptions.createFooterRow = true
    // this.gridOptions.enableCheckboxSelector = true
    this.gridOptions.editable = true
    this.gridOptions.autoEdit = true

    this.gridOptions.editCommandHandler = async (row: any, column: any, editCommand: EditCommand) => {
      this.angularGrid.dataView.getItemMetadata = this.updateItemMetadata(this.angularGrid.dataView.getItemMetadata)
      this.angularGrid.slickGrid.invalidate();

      //Intento grabar si tiene error hago undo
      try {

        if (JSON.stringify(editCommand.serializedValue) === JSON.stringify(editCommand.prevSerializedValue)) return

        editCommand.execute()
        while (this.rowLocked()) await firstValueFrom(timer(100));
        row = this.angularGrid.dataView.getItemById(row.id)

        const rowComplete = !!row.ActaNroActa && !!row.ActaDescripcion && !!row.ActaFechaActa

        if (!rowComplete)
          return

        if (row.ActaId) {
          this.rowLocked.set(true)
          await firstValueFrom(this.apiService.updateActa(row))
        } else {
          this.rowLocked.set(true)
          const response = await firstValueFrom(this.apiService.addActa(row))
          row.ActaId = response.data.ActaId
          this.angularGrid.gridService.updateItemById(row.id, row)
          this.selectedActaId.set(row.ActaId)
          this.selectedNroActa.set(row.ActaNroActa)
        }

        const emptyRows = this.angularGrid.dataView.getItems().filter((item: any) => {
          const itemComplete = !!item.ActaNroActa
            && !!item.ActaDescripcion
            && !!item.ActaFechaActa

          return !item.ActaId && !itemComplete
        })

        if (emptyRows.length === 0) {
            this.addNewItem()
        } else if (emptyRows.length > 1) {
            emptyRows.slice(0, -1).forEach((item: any) => this.angularGrid.gridService.deleteItemById(item.id))
        }

        this.angularGrid.slickGrid.setSelectedRows([])
        this.rowLocked.set(false)
      } catch (e: any) {
            

        if (row.ActaId) {
          const item = this.angularGrid.dataView.getItemById(row.id)
          if (editCommand && SlickGlobalEditorLock.cancelCurrentEdit()) {
            const fld = editCommand.editor.args.column.field
            editCommand.undo();
            item[fld] = editCommand.editor.args.item[fld]
          }
          this.angularGrid.gridService.updateItemById(row.id, item)
        } else {
          if (editCommand && SlickGlobalEditorLock.cancelCurrentEdit()) {
            editCommand.undo();
          }
          this.angularGrid.slickGrid.setSelectedRows([]);
          this.angularGrid.slickGrid.invalidate();
          this.angularGrid.slickGrid.render();
        }

        this.rowLocked.set(false)
      }
    }
  }

  async angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail
    this.angularGrid.dataView.onRowsChanged.subscribe((e, arg) => {
      // totalRecords(this.angularGrid, 'cliente')
      // columnTotal('facturacion', this.angularGrid)
    })
    if (this.apiService.isMobile())
      this.angularGrid.gridService.hideColumnByIds([])
  }

  listOptionsChange(options: any) {
    this.listOptions.set(options);
  }

  refreshListActas(event: any) {
    this.gridData.reload();
  }

  handleSelectedRowsChanged(e: any): void {
    const selrow = e.detail.args.rows[0]
    const row = this.angularGrid.slickGrid.getDataItem(selrow)
    if (row) {
      this.selectedActaId.set(row.ActaId)
      this.selectedNroActa.set(row.ActaNroActa)
    }

  }

  createNewItem(incrementIdByHowMany = 1) {
    const dataset = this.angularGrid.dataView.getItems();
    let highestId = 0;
    dataset.forEach((item: any) => {
        if (item.id > highestId) {
            highestId = item.id;
        }
    });
    const newId = highestId + incrementIdByHowMany;

    return {
      id: newId,
      ActaId: 0,
      ActaNroActa: "",
      ActaDescripcion: "",
      ActaFechaActa: "",
    };
  }

  async addNewItem() {
    const newItem1 = this.createNewItem(1);
    this.angularGrid.gridService.addItem(newItem1, { position: 'bottom', highlightRow: false, scrollRowIntoView: false, triggerEvent: false })
  }

  async selectNewItemRow() {
    const newRowIndex = this.angularGrid.dataView.getItems().length - 1
    if (newRowIndex < 0) return

    this.angularGrid.slickGrid.setSelectedRows([newRowIndex]);
    this.angularGrid.slickGrid.scrollRowIntoView(newRowIndex, false)
    this.angularGrid.slickGrid.setActiveCell(newRowIndex, 0)
  }


  updateItemMetadata(previousItemMetadata: any) {
    return (rowNumber: number) => {
      // const newCssClass = 'element-add-no-complete';
      const item = this.angularGrid.dataView.getItem(rowNumber);
      let meta = { cssClasses: '' };
      if (typeof previousItemMetadata === 'object') {
          meta = previousItemMetadata(rowNumber);
      }

      const todosVacios = Number(item?.ActaNroActa)== 0 && item.ActaDescripcion === "" && item.ActaFechaActa === ""
      const todosCompletos = item.ActaNroActa >0 && item.ActaDescripcion !== "" && item.ActaFechaActa !== ""
      if (!todosVacios && !todosCompletos) {
          meta.cssClasses = 'element-add-no-complete';
      } else {
          meta.cssClasses = '';
      }
      return meta;
    };
  }

  async deleteItem() {
    await firstValueFrom(this.apiService.deleteActa(this.selectedActaId()))
    this.selectedActaId.set(0)
    this.selectedNroActa.set(0)
    this.refreshListActas('')
  }

}