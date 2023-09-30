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
  personalId!: number
  objetivoId!:number
  valueExtendedObjetivo:any
  valueExtended: any

  onChange(evt: any) {
    console.log('onChange',evt)
  }

  onClick(evt: any) {
    console.log('onChange',evt)
    this.personalId = 699
  }

  onModelChange(evt: any) {
    console.log('onModelChangePersona',evt,this.valueExtended)
  }

  onClickObjetivo(evt: any) {
    console.log('onChange',evt)
    this.objetivoId = 780
  }

  onModelChangeObjetivo(evt: any) {
    console.log('onModelChangeObjetivo',evt,this.valueExtendedObjetivo)
  }



  ngOnInit(): void {
  }

}
