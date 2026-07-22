import { Component, signal, model, input, ViewChild } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject, takeUntil } from 'rxjs';
import { AngularGridInstance, AngularUtilService} from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SettingsService, _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NgForm } from '@angular/forms';
import { Filtro } from '../../../shared/schemas/filtro';

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
    startFilters: Filtro[] = []
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

    // Stream propio para el nombre de la persona (se consume por suscripcion en ngOnInit).
    // Al ir por switchMap, si cambia el PersonalId se cancela la peticion anterior y no queda
    // ningun setTimeout colgado pisando PersonalNombre con la persona equivocada.
    nombrePersonal$ = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() => this.searchService.getPersonalById(this.PersonalId())),
        tap(personal =>
            this.PersonalNombre.set(`${personal.PersonalApellido}, ${personal.PersonalNombre}`)
        ),
        takeUntil(this.destroy$)
    );

    $listaCustodiaPer = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() =>{
            // El backend (filtrosToSql / isFiltro) espera las claves en espaniol: operador/valor.
            // Este drawer no pasa por filtro-builder, asi que se arma el shape backend a mano.
            this.startFilters = [{index:'ApellidoNombre', condition:'AND', operador:'=', valor: [`${this.PersonalId()}`] , closeable:true, label:'', name:''}]
            return this.searchService.getListaPersonalCustodia({filtros: this.startFilters, sort:null} , this.periodo())
        }),
        map(data => {
            data.forEach((obj:any) =>{
                obj.FechaInicio = new Date(obj.FechaInicio)
                obj.FechaFin = obj.FechaFin ? new Date(obj.FechaFin) : null
            })
            return data
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

        this.nombrePersonal$.subscribe();
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