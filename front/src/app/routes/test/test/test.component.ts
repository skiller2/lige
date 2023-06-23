import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Column, Formatters, GridOption } from 'angular-slickgrid';
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
import { DescuentoJSON } from 'src/app/shared/schemas/ResponseJSON';
import { Options } from 'src/app/shared/schemas/filtro';

/** config ng-zorro-antd i18n **/

@Component({
  selector: 'test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.less']
})
export class TestComponent {
  columnDefinitions1: Column[] = [];
  gridOptions1!: GridOption;
  dataset1!: any[];



  constructor(private apiService: ApiService) {}
  ngAfterViewInit(): void {}

  ngOnInit(): void {
    this.columnDefinitions1 = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, type:'string' },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true },
      { id: '%', name: '% Complete', field: 'percentComplete', sortable: true },
      { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso },
      { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true }
    ];
    this.gridOptions1 = {
      enableAutoResize: false,
      enableSorting: true,
      gridHeight: 225,
      gridWidth: 800,
    };

    this.dataset1 = this.mockData(1000);

  }

  mockData(count: number) {
    // mock a dataset
    const mockDataset = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));
      const randomPercent = Math.round(Math.random() * 100);

      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        start: new Date(randomYear, randomMonth + 1, randomDay),
        finish: new Date(randomYear + 1, randomMonth + 1, randomDay),
        effortDriven: (i % 5 === 0)
      };
    }

    return mockDataset;
  }

  selectedOptions: Options = {
    filtros: [],
    sort: null,
  };

  listOfFields = ['Apellido', 'Nombre'];
  queryField = [''];

  listOfItem = [''];
  index = 0;
  addItem(field: NzSelectComponent, input: HTMLInputElement): void {
    const value = field.activatedValue + ' ' + input.value;
    if (input.value == '') return;
    if (this.listOfItem.indexOf(value) === -1) {
      this.queryField = [...this.queryField, value];
      this.listOfItem = [...this.listOfItem, value];
      input.value = '';
    }
  }

  tags = ['1=1'];
  inputVisible = false;
  inputValue = '';
  @ViewChild('inputElement', { static: false }) inputElement?: ElementRef;

  handleClose(removedTag: {}): void {
    this.tags = this.tags.filter(tag => tag !== removedTag);
  }

  sliceTagName(tag: string): string {
    const isLongTag = tag.length > 20;
    return isLongTag ? `${tag.slice(0, 20)}...` : tag;
  }

  showInput(): void {
    this.inputVisible = true;
    setTimeout(() => {
      this.inputElement?.nativeElement.focus();
    }, 10);
  }

  handleInputConfirm2(field: NzSelectComponent, input: HTMLInputElement): void {
    const value = field.activatedValue + ' ' + input.value;

    if (input.value && this.tags.indexOf(value) === -1) {
      this.tags = [...this.tags, value];
      input.value = '';
      this.inputVisible = false;
    }
  }

  ngOnDestroy() {}
}
