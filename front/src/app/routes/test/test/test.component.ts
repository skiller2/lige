import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AngularGridInstance, Column, Editors, FieldType, Filters, Formatters, GridOption, SlickRowDetailView } from 'angular-slickgrid';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import {
  NzTableSortOrder,
  NzTableSortFn,
  NzTableFilterList,
  NzTableFilterFn,
} from 'ng-zorro-antd/table';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';
import {
  BehaviorSubject,
  debounceTime,
  filter,
  map,
  switchMap,
  tap,
  throttleTime,
} from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from 'src/app/shared/row-preload-detail/row-preload-detail.component';
import { DescuentoJSON } from 'src/app/shared/schemas/ResponseJSON';
import { Options } from 'src/app/shared/schemas/filtro';
import { SharedModule } from 'src/app/shared/shared.module';

/** config ng-zorro-antd i18n **/

@Component({
  selector: 'test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.less'],
  imports: [
    SharedModule,

  ],
  standalone: true
})
export class TestComponent {
  title = 'Example 21: Row Detail View';
  subTitle = `
    Add functionality to show extra information with a Row Detail View, (<a href="https://github.com/ghiscoding/Angular-Slickgrid/wiki/Row-Detail" target="_blank">Wiki docs</a>)
    <ul>
      <li>Click on the row "+" icon or anywhere on the row to open it (the latter can be changed via property "useRowClick: false")</li>
      <li>Pass a View/Model as a Template to the Row Detail</li>
      <li>You can use "expandableOverride()" callback to override logic to display expand icon on every row (for example only show it every 2nd row)</li>
    </ul>
  `;

  angularGrid!: AngularGridInstance;
  //columnDefinitions: Column[] = [];
  //gridOptions!: GridOption;
  dataset: any[] = [];
  detailViewRowCount = 9;
  flashAlertType = 'info';
  message = '';


  gridOptions = {
    autoResize: {
      container: '#demo-container',
      rightPadding: 10
    },
    enableFiltering: true,
    enableRowDetailView: true,
    rowSelectionOptions: {
      selectActiveRow: true
    },
    datasetIdPropertyName: 'rowId', // optionally use a different "id"
    rowDetailView: {
      // optionally change the column index position of the icon (defaults to 0)
      // columnIndexPosition: 1,

      // We can load the "process" asynchronously in 2 different ways (httpClient OR even Promise)
      process: (item:any) => this.simulateServerAsyncCall(item),
      // process: (item) => this.http.get(`api/item/${item.id}`),

      // load only once and reuse the same item detail without calling process method
      loadOnce: true,

      // limit expanded row to only 1 at a time
      singleRowExpand: false,

      // false by default, clicking anywhere on the row will open the detail view
      // when set to false, only the "+" icon would open the row detail
      // if you use editor or cell navigation you would want this flag set to false (default)
      useRowClick: true,

      // how many grid rows do we want to use for the row detail panel (this is only set once and will be used for all row detail)
      // also note that the detail view adds an extra 1 row for padding purposes
      // so if you choose 4 panelRows, the display will in fact use 5 rows
      panelRows: this.detailViewRowCount,

      // you can override the logic for showing (or not) the expand icon
      // for example, display the expand icon only on every 2nd row
      // expandableOverride: (row: number, dataContext: any) => (dataContext.rowId % 2 === 1),

      // Preload View Component
      preloadComponent: RowPreloadDetailComponent,

      // View Component to load when row detail data is ready
      viewComponent: RowDetailViewComponent,

      // Optionally pass your Parent Component reference to your Child Component (row detail component)
      parent: this
    }
  };



  angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid.detail;
  }

  get rowDetailInstance(): SlickRowDetailView {
    // you can get the SlickGrid RowDetail plugin (addon) instance via 2 ways

    // option 1
    return (this.angularGrid.extensions.rowDetailView.instance || {});

    // OR option 2
    // return this.angularGrid?.extensionService.getExtensionInstanceByName(ExtensionName.rowDetailView) || {};
  }

  ngOnInit(): void {
    this.defineGrid();
  }

  columnDefinitions = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, type: FieldType.string, width: 70, filterable: true, editor: { model: Editors.text } },
    { id: 'duration', name: 'Duration (days)', field: 'duration', formatter: Formatters.decimal, params: { minDecimal: 1, maxDecimal: 2 }, sortable: true, type: FieldType.number, minWidth: 90, filterable: true },
    {
      id: 'percent2', name: '% Complete', field: 'percentComplete2', editor: { model: Editors.slider },
      formatter: Formatters.progressBar, type: FieldType.number, sortable: true, minWidth: 100, filterable: true, filter: { model: Filters.slider, operator: '>' }
    },
    { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso, sortable: true, type: FieldType.date, minWidth: 90, exportWithFormatter: true, filterable: true, filter: { model: Filters.compoundDate } },
    { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso, sortable: true, type: FieldType.date, minWidth: 90, exportWithFormatter: true, filterable: true, filter: { model: Filters.compoundDate } },
    {
      id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven',
      minWidth: 100,
      formatter: Formatters.checkmark, type: FieldType.boolean,
      filterable: true, sortable: true,
      filter: {
        collection: [{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }],
        model: Filters.singleSelect
      }
    }
  ];


  /* Define grid Options and Columns */
  defineGrid() {

   
    this.getData();
  }

  getData() {
    // mock a dataset
    this.dataset = [];
    for (let i = 0; i < 100; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));
      const randomPercent = Math.round(Math.random() * 100);

      this.dataset[i] = {
        rowId: i,
        title: 'Task ' + i,
        duration: (i % 33 === 0) ? null : Math.random() * 100 + '',
        percentComplete: randomPercent,
        percentComplete2: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, (randomMonth + 1), randomDay),
        effortDriven: (i % 5 === 0)
      };
    }
  }

  changeDetailViewRowCount() {
    if (this.angularGrid?.extensionService) {
      const options = this.rowDetailInstance.getOptions();
      if (options && options.panelRows) {
        options.panelRows = this.detailViewRowCount; // change number of rows dynamically
        this.rowDetailInstance.setOptions(options);
      }
    }
  }

  changeEditableGrid() {
    this.rowDetailInstance.addonOptions.useRowClick = false;
//    this.gridOptions.autoCommitEdit = !this.gridOptions.autoCommitEdit;
    this.angularGrid?.slickGrid.setOptions({
      editable: true,
      autoEdit: true,
      enableCellNavigation: true,
    });
    return true;
  }

  closeAllRowDetail() {
    if (this.angularGrid && this.angularGrid.extensionService) {
      this.rowDetailInstance.collapseAll();
    }
  }

  showFlashMessage(message: string, alertType = 'info') {
    this.message = message;
    this.flashAlertType = alertType;
  }

  /** Just for demo purposes, we will simulate an async server call and return more details on the selected row item */
  simulateServerAsyncCall(item: any) {
    // random set of names to use for more item detail
    const randomNames = ['John Doe', 'Jane Doe', 'Chuck Norris', 'Bumblebee', 'Jackie Chan', 'Elvis Presley', 'Bob Marley', 'Mohammed Ali', 'Bruce Lee', 'Rocky Balboa'];

    // fill the template on async delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const itemDetail = item;

        // let's add some extra properties to our item for a better async simulation
        itemDetail.assignee = randomNames[this.randomNumber(0, 10)];
        itemDetail.reporter = randomNames[this.randomNumber(0, 10)];

        // resolve the data after delay specified
        resolve(itemDetail);
      }, 1000);
    });
  }

  private randomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
