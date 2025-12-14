// secure-image.component.ts
import { Component, effect, inject, input, OnInit, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { SHARED_IMPORTS } from '../shared-imports';

import { NzImageModule } from 'ng-zorro-antd/image';

@Component({
  selector: 'app-image-loader',
  template: `
  @if (imageSrc()) {
 <img nz-image [nzSrc]="imageSrc()" nzFallback="fallback()" width="100px" height="75px" style="padding-left: 10px; padding-right: 10px;"/>
}
 `,
  imports: [SHARED_IMPORTS, NzImageModule]

})
export class ImageLoaderComponent implements OnInit {
  src = input('');
  imageSrc = signal('')
  fallback = input('')

  private readonly tokenService = inject(DA_SERVICE_TOKEN);

  constructor(private http: HttpClient) {
    effect(() => {
      if (this.src()) {
        this.ngOnInit();
      }
    })
  }

  ngOnInit(): void {
    const headers = new HttpHeaders({
      token: this.tokenService.get()?.token ?? ''
    });

    this.http.get(this.src(), { headers, responseType: 'blob' }).subscribe(blob => {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.imageSrc.set(reader.result as string)
      };
      reader.readAsDataURL(blob);
    });
  }
}
