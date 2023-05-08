import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';

@Component({
  selector: 'app-impuesto-afip',
  templateUrl: './impuesto-afip.component.html',
  styleUrls: ['./impuesto-afip.component.less'],
})
export class ImpuestoAfipComponent {

  @ViewChild('impuestoForm', { static: true }) impuestoForm: NgForm = new NgForm([], []);

  selectedDate = null;
  anio = 0;
  mes = 0;
  url = '/api/impuestos_afip';
  files: NzUploadFile[] = [];


  ngAfterViewInit(): void {
    setTimeout(() => {
      const now = new Date(); //date
      const anio =
        Number(localStorage.getItem('anio')) > 0
          ? localStorage.getItem('anio')
          : now.getFullYear();
      
      const mes =
        Number(localStorage.getItem('mes')) > 0
          ? localStorage.getItem('mes')
          : now.getMonth() + 1;
      
      this.impuestoForm.form.get('periodo')?.setValue(new Date(Number(anio),Number(mes)-1,1))

    }, 1);
  }


  onChange(result: Date): void {
    this.anio = result.getFullYear()
    this.mes = result.getMonth() + 1
  

    this.files = [];
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
