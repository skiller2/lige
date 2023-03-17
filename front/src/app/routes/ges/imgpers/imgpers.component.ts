import { Component, OnInit, ViewChild } from '@angular/core';
import { STColumn, STComponent } from '@delon/abc/st';
import { SFSchema } from '@delon/form';
import { ModalHelper, _HttpClient } from '@delon/theme';
import { BehaviorSubject, catchError, debounceTime, finalize, map, Observable, switchMap, tap } from 'rxjs';
import { FormComponent } from 'src/app/shared/imagePreview/form/form.component';
import { ResponseBySearch, Search } from 'src/app/shared/schemas/personal.schemas';
import { ResponseJSON } from 'src/app/shared/schemas/ResponseJSON';
import { SearchService } from './search.service';

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


export class ImgPersComponent implements OnInit {

  constructor(private http: _HttpClient, private searchService: SearchService) { }
  ngOnInit(): void {
  }
  isOptionsLoading: boolean = false
  selectedPersonalId: string = ''
  fileDummy: File = new File([], "")

  $searchChange = new BehaviorSubject('')
  $selectedValueChange = new BehaviorSubject('')

  $optionsArray: Observable<Search[]> = this.$searchChange
    .pipe(debounceTime(500))
    .pipe(
      switchMap((value) => this.searchService.getPersonFromName('Nombre', value)
        .pipe(
          finalize(() => this.isOptionsLoading = false),
          catchError((err, caught) => caught)
        )),
    )

  $personalImageDataFile = this.$selectedValueChange
    .pipe(
      switchMap((value) => this.searchService.getInfoFromPersonalId(value)
        .pipe(
          map((data) => data.image),
          catchError((err, caught) => caught)
        ))
    )
    .pipe(
      map((blob) => new File([blob], "image")),
      tap((file) => console.log(file))
    )
  // .subscribe((imageUrl) => {
  //   fetch(imageUrl)
  //     .then((res) => {
  //       console.log(res)
  //     })
  // }
  // )

  selectedValueChange(event: string): void {
    this.$selectedValueChange.next(event)
  }

  search(value: string): void {
    if (value) this.isOptionsLoading = true; this.$searchChange.next(value)
  }
}
