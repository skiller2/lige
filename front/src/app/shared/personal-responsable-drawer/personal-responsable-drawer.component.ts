import { Component, Injector, viewChild, inject, signal, model, computed, ViewEncapsulation, input, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject, firstValueFrom } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, FileType, GridOption, SlickGrid } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SettingsService, _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FormBuilder, FormArray } from '@angular/forms';

@Component({
    selector: 'app-personal-responsable-drawer',
    templateUrl: './personal-responsable-drawer.component.html',
    styleUrl: './personal-responsable-drawer.component.less',
    standalone: true,
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule],
    providers: [AngularUtilService],
})
  
export class PersonalResponsableDrawerComponent {
    PersonalId = input(0)
    PersonalNombre = signal<string>("")
    visibleResponsable = model<boolean>(false)
    periodo = signal(new Date());
    placement: NzDrawerPlacement = 'left';
    isLoading = signal(false);

    constructor(
        private searchService: SearchService,
        private apiService: ApiService,
        private router: Router,
        private route: ActivatedRoute,
        private settingService: SettingsService,
    ) { }
    private destroy$ = new Subject();

    selectedPersonalIdChange$ = new BehaviorSubject('');

    fb = inject(FormBuilder)
    formResponsable = this.fb.group({
        GrupoActividadId:0, Desde:null
    })

    $optionsResponsable = this.searchService.getGrupoActividadOptions();
    $listaResponsablePer = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() =>{
            setTimeout(async () => {
                const personal = await firstValueFrom(this.searchService.getPersonalById(this.PersonalId()))
                this.PersonalNombre.set(personal.PersonalApellido+', '+personal.PersonalNombre)
            }, 0);
            return this.apiService.getResponsablesListByPersonalId(
                Number(this.PersonalId())
            ).pipe(map(data => {
                data.map((obj:any) =>{
                    let inicio = new Date(obj.Desde)
                    let fin = obj.Hasta? new Date(obj.Hasta) : null
                    obj.Desde = `${inicio.getDate()}/${inicio.getMonth()+1}/${inicio.getFullYear()}`
                    obj.Hasta = fin? `${fin.getDate()}/${fin.getMonth()+1}/${fin.getFullYear()}` : ''
                })
                return data
            }))
        })
    );

    async ngOnInit(){
        const formatter = new Intl.DateTimeFormat('es-ES', {year: 'numeric', month: '2-digit', day: '2-digit'});
        const date:Date = new Date()
        const formattedDate = formatter.format(date);
        const [day, month, year] = formattedDate.split('/').map(Number)
        this.periodo.set(new Date(year, month - 1, day))

        this.selectedPersonalIdChange$.next('');
    }

    ngOnDestroy(): void {
        this.destroy$.next('');
        this.destroy$.complete();
    }

    async save() {
        this.isLoading.set(true)
        let values = this.formResponsable.value
        try {
            await firstValueFrom(this.apiService.setGrupoActividadPersonal(this.PersonalId(), values))
            this.selectedPersonalIdChange$.next('')
            this.formResponsable.markAsUntouched()
            this.formResponsable.markAsPristine()
        } catch (e) {

        }
        this.isLoading.set(false)
    }
}