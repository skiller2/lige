import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef, effect,  } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { FormControl, NgForm, FormBuilder } from '@angular/forms';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom, debounceTime, switchMap, tap } from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { EditorCategoriaComponent } from 'src/app/shared/editor-categoria/editor-categoria.component';
import { InasistenciaSearchComponent } from 'src/app/shared/inasistencia-search/inasistencia-search.component';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

export interface Option {
    label: string;
    value: string;
}
  
@Component({
    selector: 'app-ayuda-asistencial-drawer',
    imports: [SHARED_IMPORTS, NzUploadModule, NzDescriptionsModule, ReactiveFormsModule, PersonalSearchComponent, CommonModule],
    templateUrl: './ayuda-asistencial-drawer.component.html',
    styleUrl: './ayuda-asistencial-drawer.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class AyudaAsistencialDrawerComponent {
    tituloDrawer = signal<string>('Alta de Ayuda Asistencial')
    periodo = input.required<Date>()
    visible = model<boolean>(false)
    refresh = model<number>(0)
    currDate = signal(new Date())
    placement: NzDrawerPlacement = 'left';
    options: any[] = [];
    isSaving = signal(false)
    tipoChange = signal(0)
    private apiService = inject(ApiService)
    constructor(private searchService: SearchService) { 
        effect(() => {
            if(this.periodo()) {
                this.formAyudaAsi.patchValue({ aplicaEl: this.periodo() })
            }
            if (!this.visible()) {
                this.formAyudaAsi.patchValue({ personalId: 0, formaId: null, aplicaEl:new Date(), cantCuotas:1, importe:'', motivo:'', personalPrestamoId:0 })
            }
        })
    }

    fb = inject(FormBuilder)
    formAyudaAsi = this.fb.group({ personalId: 0, formaId: null, aplicaEl:new Date(), cantCuotas:1, importe:'', motivo:'', personalPrestamoId:0 })

    /*conditional = computed(async () => {
        if (!this.visible()) {
            this.formAyudaAsi.patchValue({ personalId: 0, formaId: null, aplicaEl:new Date(), cantCuotas:1, importe:1, motivo:'1' })
        }
    });*/

    formChange$ = new BehaviorSubject('');
    tableLoading$ = new BehaviorSubject(false);
    listaAdelantos$ = this.formChange$.pipe(
        debounceTime(500),
        switchMap(() =>
          this.apiService
            .getAyudaAsitencialByPersonalId(this.formAyudaAsi.get('aplicaEl')?.value, this.formAyudaAsi.get('personalId')?.value, this.formAyudaAsi.get('formaId')?.value)
            .pipe(
              doOnSubscribe(() => this.tableLoading$.next(true)),
              tap({ complete: () => this.tableLoading$.next(false) })
            )
        )
    );

    $sitrevista = this.formAyudaAsi.get('personalId')!.valueChanges.pipe(
        debounceTime(500),
        switchMap(() =>
            this.apiService
                .getPersonaSitRevista(
                    Number(this.formAyudaAsi.get('personalId')?.value),
                    this.periodo().getFullYear(),
                    this.periodo().getMonth()+1
                )
        )
    )

    formChange(event: any) {
        this.formChange$.next(event);
    }

    async ngOnInit(): Promise<void> {
        this.options = await firstValueFrom(this.searchService.getTipoPrestamo())
        this.currDate.set(new Date())
        setTimeout(() => {
            this.formAyudaAsi.patchValue({ aplicaEl: this.periodo() })
        }, 1000);
    }

    async save(){
        this.isSaving.set(true)
        try {
            let values = this.formAyudaAsi.getRawValue()
            if(values.personalPrestamoId == 0) {
            const res = await firstValueFrom(this.apiService.addAyudaAsistencial(values))
            console.log('res: ', res.data);
                if(res.data?.personalPrestamoId > 0) {
                    this.formAyudaAsi.patchValue({ personalPrestamoId: res.data?.personalPrestamoId })
                    this.tituloDrawer.set('Actualizar Ayuda Asistencial')
                    this.formAyudaAsi.get('personalId')?.disable()

                }
            } else {
                const res = await firstValueFrom(this.apiService.updateAyudaAsistencial(values))
                console.log('res: ', res);
            }
            //this.formChange('')
            let ref = this.refresh()
            this.refresh.set(++ref)
        } catch (error) {
            
        }
        this.isSaving.set(false)
        this.formAyudaAsi.markAsDirty()
        this.formAyudaAsi.markAsPristine()
    }

    async onChangeTipo(result: number){
        let values = this.formAyudaAsi.value
        if (values.personalId && !values.aplicaEl) {
            try {
                const res = await firstValueFrom(this.searchService.getProxAplicaEl({personalId:values.personalId, tipo:result}))
                if(res.aplicaEl) this.formAyudaAsi.controls['aplicaEl'].patchValue(res.aplicaEl)
            } catch (error) {
                
            } 
        }
    }

    resetForm() {
        this.formAyudaAsi.reset( {personalId: 0, formaId: null, aplicaEl:this.periodo(), cantCuotas:1, importe:'', motivo:'', personalPrestamoId:0} )
        this.tituloDrawer.set('Alta de Ayuda Asistencial')
        this.formAyudaAsi.get('personalId')?.enable()
        this.formAyudaAsi.markAsDirty()
        this.formAyudaAsi.markAsPristine()
    }

}