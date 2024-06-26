import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, ViewChild, ViewEncapsulation, inject } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { AngularGridInstance, AngularSlickgridComponent, AngularSlickgridModule, Column, ContainerService, Editors, FieldType, Filters, Formatters, GridOption, SlickRowDetailView } from 'angular-slickgrid';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmComponent } from 'ng-zorro-antd/popconfirm';
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
  firstValueFrom,
  map,
  switchMap,
  tap,
  throttleTime,
} from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { ObjetivoSearchComponent } from 'src/app/shared/objetivo-search/objetivo-search.component';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from 'src/app/shared/row-preload-detail/row-preload-detail.component';
import { DescuentoJSON } from 'src/app/shared/schemas/ResponseJSON';
import { Options } from 'src/app/shared/schemas/filtro';
import { Directionality } from '@angular/cdk/bidi';
import { DescuentosComponent } from '../../ges/descuentos/descuentos.component';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

/** config ng-zorro-antd i18n **/

@Component({
  selector: 'test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.less'],
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule, ObjetivoSearchComponent, PersonalSearchComponent, AngularSlickgridModule, DescuentosComponent, ZXingScannerModule],
  providers: [ContainerService,],

})

export class TestComponent {
  public _ContainerService = inject(ContainerService)
  public apiService = inject(ApiService)
  personalId!: number
  objetivoId!: number
  valueExtendedObjetivo: any
  valueExtended: any
  confirmation!: NzPopconfirmComponent
  @ViewChild('btntest', { static: false }) btn!: ElementRef<any>
  @ViewChild('nzpc', { static: false }) nzpc!: NzPopconfirmComponent
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dir = inject(Directionality);
  private modalService = inject(NzModalService);
  private el = inject(ElementRef);
  private document = inject(DOCUMENT)
  nacimiento: Date = new Date('1973-05-24')
  allowedBarCodeFormats = [BarcodeFormat.PDF_417, BarcodeFormat.QR_CODE]
  periodo1 = { year: 2024, month: 3 }
  onChange(evt: any) {
    console.log('onChange', evt)
  }

  onClick(evt: any) {
    console.log('onChange', evt)
    this.personalId = 699
  }

  onModelChange(evt: any) {
    console.log('onModelChangePersona', evt, this.valueExtended)
  }

  onClickObjetivo(evt: any) {
    console.log('onChange', evt)
    this.objetivoId = 780
  }

  onModelChangeObjetivo(evt: any) {
    console.log('onModelChangeObjetivo', evt, this.valueExtendedObjetivo)
  }



  ngOnInit(): void {

    setTimeout(() => {
    }, 3000);
  }

  click1(e: any): void {
    this.nzpc.setOverlayOrigin(new ElementRef(e.target));

    this.nzpc.hide()
    this.nzpc.show()
    this.periodo1 = { year: 2023, month: 3 }
  }

  click2(): void {
    this.confirmation.hide()
    this.confirmation.show()

  }


  clickTest(): void {
    console.log('curr this.confirmation', this.confirmation)
  }

  lastScan = ''
  async scanComplete(e: any) {
    if (e == this.lastScan)
      return
    const res: any = await firstValueFrom(this.apiService.getIdentCode(e, ''));


    console.log('scanComplete', e)
    this.lastScan = e


  }
  scanSuccess(e: string) {

  }

}
