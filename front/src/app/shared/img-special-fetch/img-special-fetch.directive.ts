import { computed, Directive, ElementRef, inject, input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Directive({
  selector: '[appImgSpecialFetch]',
  standalone: true
})
export class ImgSpecialFetchDirective {
  specialSrc = input('')
  appImgSpecialFetch = input('')
  el = inject(ElementRef)
  http = inject(HttpClient)

  resultado = computed(async () => {
    if (this.specialSrc()) {
      const res = await firstValueFrom( this.http.get(this.specialSrc(), { responseType: 'blob' }))
      const url = URL.createObjectURL(res);
      this.el.nativeElement.src = url;
    }
    
    return true
  })


}
