// secure-image.component.ts
import { Component, inject, input, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { SHARED_IMPORTS } from '../shared-imports';
import { CommonModule } from '@angular/common';
import { NzImageModule } from 'ng-zorro-antd/image';

@Component({
  selector: 'app-image-loader',
  template: `
  @if (imageSrc) {
 <img nz-image [nzSrc]="imageSrc" />
}
 `,
 imports: [SHARED_IMPORTS, CommonModule, NzImageModule]
  
})
export class ImageLoaderComponent implements OnInit {
  src= input('');
  imageSrc: string | null = null;

  private readonly tokenService = inject(DA_SERVICE_TOKEN);

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    const headers = new HttpHeaders({
      token:this.tokenService.get()?.token ?? ''
    });

    this.http.get(this.src(), { headers, responseType: 'blob' }).subscribe(blob => {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.imageSrc = reader.result as string;
      };
      reader.readAsDataURL(blob);
    });
  }
}
