import { Component } from '@angular/core';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';

@Component({
  selector: 'app-impuesto-afip',
  templateUrl: './impuesto-afip.component.html',
  styleUrls: ['./impuesto-afip.component.less'],
})
export class ImpuestoAfipComponent {
  selectedDate = null;
  selectedPeriodo = {
    anio: '',
    mes: '',
  };
  url = '/api/impuestos_afip';
  files: NzUploadFile[] = [];

  onChange(result: Date): void {
    this.files = [];
    this.selectedPeriodo = {
      anio: String(result.getFullYear()),
      mes: String(result.getMonth() + 1).padStart(2, '0'),
    };
  }

  handleChange({ file, fileList }: NzUploadChangeParam): void {
    // const status = file.status;
    // if (status !== 'uploading') {
    //   console.log(file, fileList);
    // }
    // if (status === 'done') {
    //   this.msg.success(`${file.name} file uploaded successfully.`);
    // } else if (status === 'error') {
    //   this.msg.error(`${file.name} file upload failed.`);
    // }
  }
}
