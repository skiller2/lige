import { Component, Injector, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject, Subject, debounceTime, switchMap, takeUntil, tap } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';

@Component({
  selector: 'app-adelanto',
  templateUrl: './adelanto.component.html',
  styleUrls: ['./adelanto.component.less']
})
export class AdelantoComponent {
  constructor(private searchService: SearchService, private injector: Injector, private apiService: ApiService){}
  @ViewChild('adelanto', { static: true }) adelanto!: NgForm

  private destroy$ = new Subject();

  anio = new Date().getFullYear()  
  mes = new Date().getMonth() + 1  


  formChange$ = new BehaviorSubject('')
  listaAdelantos$ = this.formChange$.pipe(
    tap(() => console.log('log!')),
    debounceTime(500),
    switchMap(() => this.apiService.getAdelantos(this.adelanto.controls['anio'].value, this.adelanto.controls['mes'].value, this.adelanto.controls['PersonalId'].value)),
  )

  formChanged(event: any) {
    console.log('form Changed')
    this.formChange$.next('')
  }

  resetForm(){
    this.adelanto.resetForm({
      anio: new Date().getFullYear(),
      mes: new Date().getMonth() + 1,
      PersonalId: ''
    })
  }
  loadForm(){
    
  }
  SaveForm(){
    // this.searchService.setAsistenciaExcepcion(this.adelanto.value)
    // .pipe(
    //   // switchMap(() => this.$listaExcepciones = this.searchService.getExcepxObjetivo(this.asistenciaexcepcion.controls['ObjetivoId'].value, this.asistenciaexcepcion.controls['anio'].value, this.asistenciaexcepcion.controls['mes'].value)),
    //   //      tap(() => this.$isObjetivoOptionsLoading.next(false))
    //   takeUntil(this.destroy$)
    // )
    // .subscribe({
    //   next: (data) => console.log('data', data),
    //   error: (err) => {
    //     console.log('error', err)
    //   },
    //   complete: () => {
    //     console.log('complete')

    //     this.adelanto.controls['PersonaId'].setValue('');
    //     this.adelanto.controls['monto'].setValue('');

    //     this.notification.success('Grabación', 'Existosa')

    //   }
    // }
    // )

  }
  ngOnDestroy(): void {
    this.destroy$.next('');
    this.destroy$.complete();
  }
}
