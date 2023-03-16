import { Component, OnInit, ViewChild } from '@angular/core';
import { STColumn, STComponent } from '@delon/abc/st';
import { SFSchema } from '@delon/form';
import { ModalHelper, _HttpClient } from '@delon/theme';
import { BehaviorSubject, finalize, map, Observable } from 'rxjs';
import { FormComponent } from 'src/app/shared/imagePreview/form/form.component';
import { SearchResponse, SearchService } from './search.service';

interface ResponseData {
  PersonalId: number,
  fullName: string
}

@Component({
  selector: 'app-ges-imgpers',
  templateUrl: './imgpers.component.html',
  styles: [
    `
      .resize-trigger {
        width: 2px;
        height: 100%;
        /*margin-top: 12px;*/
        background: #e8e8e8;
      }

      .nz-resizable-preview {
        border-width: 0;
        border-right-width: 1px;
      }

      .ant-tabs-tab {
        margin-right: 0;
        padding-left: 15px;
        padding-right: 15px;
      }

      nz-select {
        width: 200px;
      }
    `
  ]
})


export class ImgPersComponent {

  constructor(private http: _HttpClient, private searchService: SearchService) { }


  selectedValue: string = ''
  $optionsArray: Observable<Array<ResponseData>> = this.searchService.$response.pipe(
    map((res: SearchResponse) => res.data)
  )


  search(value: string): void {
    this.searchService.search('Nombre', value)
  }
}
