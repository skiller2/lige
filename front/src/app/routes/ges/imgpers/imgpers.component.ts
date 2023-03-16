import { Component, OnInit, ViewChild } from '@angular/core';
import { STColumn, STComponent } from '@delon/abc/st';
import { SFSchema } from '@delon/form';
import { ModalHelper, _HttpClient } from '@delon/theme';
import { FormComponent } from 'src/app/shared/imagePreview/form/form.component';

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
    `
  ]
})
export class ImgPersComponent implements OnInit {
  url = `/user`;
  listOfData: any = [{ index: '1', name: 'Alfredo', age: 48, address: 'Anchorena 1528' }];
  cols: any = [];

  trackByIndex(_: number, data: any): number {
    return data.index;
  }

  searchSchema: SFSchema = {
    properties: {
      no: {
        type: 'string',
        title: '编号'
      }
    }
  };
  @ViewChild('st') private readonly st!: STComponent;
  columns: STColumn[] = [
    { title: '编号', index: 'no' },
    { title: '调用次数', type: 'number', index: 'callNo' },
    { title: '头像', type: 'img', width: '50px', index: 'avatar' },
    { title: '时间', type: 'date', index: 'updatedAt' },
    {
      title: '',
      buttons: [
        // { text: '查看', click: (item: any) => `/form/${item.id}` },
        // { text: '编辑', type: 'static', component: FormEditComponent, click: 'reload' },
      ]
    }
  ];

  constructor(private http: _HttpClient, private modal: ModalHelper) {}

  onResize(evt: any, col: string): void {
    const width = evt.width;
    this.cols = this.cols.map((e: { title: string }) => (e.title === col ? { ...e, width: `${width}px` } : e));
  }

  ngOnInit(): void {
    this.cols = [
      {
        title: 'Full Name',
        width: '200px'
      },
      {
        title: 'Age',
        width: '100px'
      },
      {
        title: 'Address',
        width: '200px'
      },
      {
        title: 'Address',
        width: ''
      },
      {
        title: 'Address',
        width: ''
      },
      {
        title: 'Address',
        width: ''
      },
      {
        title: 'Address',
        width: ''
      },
      {
        title: 'Address',
        width: ''
      },
      {
        title: 'Address',
        width: ''
      },
      {
        title: 'Address',
        width: ''
      },
      {
        title: 'Address',
        width: ''
      },
      {
        title: 'Actions'
      }
    ];

    this.listOfData.push({ index: '2', name: 'Valeria', age: 49, address: 'Anchorena 1528' });
    this.listOfData.push({ index: '3', name: 'Valeria', age: 49, address: 'Anchorena 1528' });
    this.listOfData.push({ index: '4', name: 'Valeria', age: 49, address: 'Anchorena 1528' });
    this.listOfData.push({ index: '5', name: 'Valeria', age: 49, address: 'Anchorena 1528' });
    this.listOfData.push({ index: '6', name: 'Valeria', age: 49, address: 'Anchorena 1528' });
    this.listOfData.push({ index: '7', name: 'Valeria', age: 49, address: 'Anchorena 1528' });
    this.listOfData.push({ index: '8', name: 'Valeria', age: 49, address: 'Anchorena 1528' });
    this.listOfData.push({ index: '9', name: 'Valeria', age: 49, address: 'Anchorena 1528' });
    this.listOfData.push({ index: '10', name: 'Valeria', age: 49, address: 'Anchorena 1528' });
  }

  add(): void {
    // this.modal
    //   .createStatic(FormEditComponent, { i: { id: 0 } })
    //   .subscribe(() => this.st.reload());
  }
}
