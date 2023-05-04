import { Component } from '@angular/core';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';

@Component({
  selector: 'app-impuesto-afip',
  templateUrl: './impuesto-afip.component.html',
  styleUrls: ['./impuesto-afip.component.less'],
})
export class ImpuestoAfipComponent {
  url = '/api/impuestos_afip';
  files: NzUploadFile[] = [];
  handleChange({ file, fileList }: NzUploadChangeParam): void {
    const status = file.status;
    if (status !== 'uploading') {
      console.log(file, fileList);
    }
    // if (status === 'done') {
    //   this.msg.success(`${file.name} file uploaded successfully.`);
    // } else if (status === 'error') {
    //   this.msg.error(`${file.name} file upload failed.`);
    // }
  }
}
