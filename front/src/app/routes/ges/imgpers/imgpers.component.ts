import { Component, OnInit, ViewChild } from '@angular/core';
import { STColumn, STComponent } from '@delon/abc/st';
import { SFSchema } from '@delon/form';
import { ModalHelper, _HttpClient } from '@delon/theme';
import { BehaviorSubject, debounceTime, finalize, map, Observable, switchMap } from 'rxjs';
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

      img {
        max-width: 10vw;
        max-height: 10vh;
      }
    `
  ]
})


export class ImgPersComponent implements OnInit{

  constructor(private http: _HttpClient, private searchService: SearchService) { }
  ngOnInit(): void {

    this.$optionsArray.subscribe((option) => this.isOptionsLoading = false)

  }
  isOptionsLoading: boolean = false


  selectedPersonalId: string = ''
  $searchChange = new BehaviorSubject('')
  $optionsArray: Observable<Array<ResponseData>> = this.$searchChange
  .pipe(debounceTime(500))
  .pipe(
    switchMap((value) => this.searchService.getPersonFromName('Nombre', value)),
  )
  .pipe(
    finalize(() => this.isOptionsLoading = false),
    map((res: SearchResponse) => res.data)
  )

  $personalImageDataPath!: Observable<any>

  selectedValueChange(event: string): void {
    this.selectedPersonalId = event
    this.searchService.getInfoFromPersonalId(event).pipe(map((data) => data.image)).subscribe((imageUrl) => {
      fetch(imageUrl)
        .then((res) => {
          console.log(res)
        })
    })
  }
  search(value: string): void {
    this.isOptionsLoading = true
    if (value) this.$searchChange.next(value)
  }
}
