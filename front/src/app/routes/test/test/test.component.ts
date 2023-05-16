import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { NzTableSortOrder, NzTableSortFn, NzTableFilterList, NzTableFilterFn } from 'ng-zorro-antd/table';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';
import { BehaviorSubject, debounceTime, filter, map, switchMap, tap, throttleTime } from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { DescuentoJSON } from 'src/app/shared/schemas/ResponseJSON';

/** config ng-zorro-antd i18n **/



@Component({
  selector: 'test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.less'],
})


export class TestComponent {

  constructor(private apiService: ApiService
  ) {
  }
  ngAfterViewInit(): void {




  }

  ngOnInit(): void { 


  }

  listOfFields = ['Apellido','Nombre']
  queryField = ['']

  listOfItem = [''];
  index = 0;
  addItem(field: NzSelectComponent, input: HTMLInputElement): void {
    const value = field.activatedValue+" "+ input.value;
    if (input.value == "") return;
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
    const value = field.activatedValue+" "+ input.value;

    if (input.value && this.tags.indexOf(value) === -1) {
      this.tags = [...this.tags, value];
      input.value = '';
      this.inputVisible = false;

    }

  }


  ngOnDestroy() {
  }
}
