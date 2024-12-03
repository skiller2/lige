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

@Component({
    selector: 'app-personal-custodias-drawer',
    templateUrl: './personal-custodias-drawer.component.html',
    styleUrl: './personal-custodias-drawer.component.less',
    standalone: true,
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule],
    providers: [AngularUtilService],
})
  
export class PersonalCustodiasDrawerComponent {
    PersonalId = input(0)
    PersonalNombre = signal<string>("")
    visibleCustodias = model<boolean>(false)
    periodo = signal<Date>(new Date);
    placement: NzDrawerPlacement = 'left';
    startFilters: { index: string; condition: string; operador: string; valor: string[]; closeable: boolean }[] = []

    constructor(
        private searchService: SearchService,
        // private apiService: ApiService,
        // private router: Router,
        // private route: ActivatedRoute,
        // private settingService: SettingsService,
    ) { }
    private destroy$ = new Subject();

    // $selectedObjetivoIdChange = new BehaviorSubject('');
    selectedPersonalIdChange$ = new BehaviorSubject('');

    $listaCustodiaPer = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() =>{
            setTimeout(async () => {
                const personal = await firstValueFrom(this.searchService.getPersonalById(this.PersonalId()))
                this.PersonalNombre.set(personal.PersonalApellido+', '+personal.PersonalNombre)
            }, 0);
            this.startFilters = [{index:'ApellidoNombre', condition:'AND', operador:'=', valor: [`${this.PersonalId()}`] , closeable:true}]
            return this.searchService.getListaPersonalCustodia({filtros: this.startFilters, sort:null} , new Date())
            .pipe(map(data => {
                data.map((obj:any) =>{
                    let inicio = new Date(obj.fecha_inicio)
                    let fin = new Date(obj.fecha_fin)
                    obj.fecha_inicio = `${inicio.getDate()}/${inicio.getDate()+1}/${inicio.getFullYear()}`
                    obj.fecha_fin = `${fin.getDate()}/${fin.getDate()+1}/${fin.getFullYear()}`
                })
                return data
            }))
        })
    );

    async ngOnInit(){
        const date:Date = new Date()
        this.periodo.set(date)
        this.selectedPersonalIdChange$.next('');
    }

    ngOnDestroy(): void {
        this.destroy$.next('');
        this.destroy$.complete();
    }
}