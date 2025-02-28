import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, viewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, NgForm } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmComponent } from 'ng-zorro-antd/popconfirm';
import { GeocoderAutocomplete } from '@geoapify/geocoder-autocomplete';

import { ApiService } from 'src/app/services/api.service';
import { ObjetivoSearchComponent } from 'src/app/shared/objetivo-search/objetivo-search.component';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';

import { Directionality } from '@angular/cdk/bidi';
import { DescuentosComponent } from '../../ges/descuentos/descuentos.component';
import { BarcodeFormat } from '@zxing/library';
import { I18NService } from '@core';

/** config ng-zorro-antd i18n **/

@Component({
    selector: 'test',
    templateUrl: './test.component.html',
    styleUrls: ['./test.component.less'],
    imports: [...SHARED_IMPORTS, CommonModule],
    providers: [],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class TestComponent {
  public apiService = inject(ApiService)
  personalId!: number
  objetivoId!: number
  valueExtendedObjetivo: any
  valueExtended: any
  confirmation!: NzPopconfirmComponent
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dir = inject(Directionality);
  private el = inject(ElementRef);
  private document = inject(DOCUMENT)
  nacimiento: Date = new Date('1973-05-24')
  allowedBarCodeFormats = [BarcodeFormat.PDF_417, BarcodeFormat.QR_CODE]

  i18NService = inject(I18NService)

   periodo1 = { year: 2024, month: 3 }
  onChange(evt: any) {
    console.log('onChange', evt)
  }
  //form = viewChild.required(NgForm);
  personaf = viewChild.required(NgForm);


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

    console.log('I18NService.getDateFormat()',this.i18NService.getDateFormat())

    const autocomplete = new GeocoderAutocomplete(
      this.el.nativeElement ,
      'f5cdd3892a38432fbcd0edc786268446',
      { /* Geocoder options */ })
  
/*


    this.autocomplete.on('select', (location) => {
      // check selected location here 
    });
    
    this.autocomplete.on('suggestions', (suggestions) => {
      // process suggestions here
    });    
*/
    //this.personaf().form.controls['telefonos'] = new FormArray([])


    //this.personaf().form.addControl('telefonos', new FormArray([]))
    /*
    const tels = this.personaf().form.get("telefonos") as FormArray

    async () => {
      tels.push(new FormGroup([new FormControl('PersonalId'), new FormControl('Importe')]));
      tels.push(new FormGroup([new FormControl('PersonalId'), new FormControl('Importe')]));
    }


    setTimeout(() => {
      this.personaf().form.patchValue({ nombre: 'mario', telefonos: [{ PersonalId: '111111' }, { PersonalId: '22222' }, { PersonalId: '333333' }] })
    }, 1000);
    */
  }



  click2(): void {
    this.confirmation.hide()
    this.confirmation.show()

  }


  clickTest(): void {
    console.log('curr this.confirmation', this.confirmation)
  }


    



}
