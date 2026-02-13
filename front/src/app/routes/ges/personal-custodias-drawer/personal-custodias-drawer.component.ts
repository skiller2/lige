import { Component, Injector, viewChild, inject, signal, model, computed, ViewEncapsulation, input, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject, firstValueFrom } from 'rxjs';
import { AngularGridInstance, AngularUtilService} from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SettingsService, _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NgForm } from '@angular/forms';
import { Selections } from 'src/app/shared/schemas/filtro';

@Component({
    selector: 'app-personal-custodias-drawer',
    templateUrl: './personal-custodias-drawer.component.html',
    styleUrl: './personal-custodias-drawer.component.less',
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule],
    providers: [AngularUtilService]
})
  
export class PersonalCustodiasDrawerComponent {
    PersonalId = input(0)
    PersonalNombre = signal<string>("")
    anio = signal(0);
    mes = signal(0);
    visibleCustodias = model<boolean>(false)
    periodo = signal<Date>(new Date);
    placement: NzDrawerPlacement = 'left';
    startFilters: Selections[] = []
    @ViewChild('personalCustodiasDrawerForm') personalCustodiasDrawerForm?: NgForm;

    constructor(
        private searchService: SearchService,
        // private apiService: ApiService,
        // private router: Router,
        // private route: ActivatedRoute,
        // private settingService: SettingsService,
    ) { }
    private destroy$ = new Subject();

    selectedPersonalIdChange$ = new BehaviorSubject('');

    $listaCustodiaPer = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() =>{
            setTimeout(async () => {
                const personal = await firstValueFrom(this.searchService.getPersonalById(this.PersonalId()))
                this.PersonalNombre.set(personal.PersonalApellido+', '+personal.PersonalNombre)
            }, 0);
            this.startFilters = [{index:'ApellidoNombre', condition:'AND', operator:'=', value: [`${this.PersonalId()}`] , closeable:true}]
            return this.searchService.getListaPersonalCustodia({filtros: this.startFilters, sort:null} , this.periodo())
            .pipe(map(data => {
                data.map((obj:any) =>{
                    let inicio = new Date(obj.fecha_inicio)
                    let fin = obj.fecha_fin? new Date(obj.fecha_fin) : obj.fecha_fin
                    obj.fecha_inicio = `${inicio.getDate()}/${inicio.getMonth()+1}/${inicio.getFullYear()}`
                    obj.fecha_fin = fin? `${fin.getDate()}/${fin.getMonth()+1}/${fin.getFullYear()}` : fin
                })
                return data
            }))
        })
    );

    async ngOnInit(){
        const now = new Date(); //date
        const anio =
            Number(localStorage.getItem('anio')) > 0
                ? Number(localStorage.getItem('anio'))
                : now.getFullYear();
        const mes =
            Number(localStorage.getItem('mes')) > 0
                ? Number(localStorage.getItem('mes'))
                : now.getMonth() + 1;

        this.anio.set(anio);
        this.mes.set(mes);
        this.periodo.set(new Date(anio, mes - 1, 1)); 
    }

    ngOnDestroy(): void {
        this.destroy$.next('');
        this.destroy$.complete();
    }

    selectedValueChange(event: any): void {
       
        this.anio.set(event.getFullYear());
        this.mes.set(event.getMonth() + 1);
        this.periodo.set(event);
        localStorage.setItem('anio', String(this.anio()));
        localStorage.setItem('mes', String(this.mes()));
        this.selectedPersonalIdChange$.next(this.PersonalId().toString());

}
}