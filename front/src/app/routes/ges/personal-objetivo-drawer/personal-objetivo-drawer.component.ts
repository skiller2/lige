import { Component, effect, signal, model, input, ViewChild } from '@angular/core';
import { BehaviorSubject, debounceTime, switchMap } from 'rxjs';
import { AngularUtilService } from 'angular-slickgrid';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NgForm } from '@angular/forms';

@Component({
    selector: 'app-personal-objetivo-drawer',
    templateUrl: './personal-objetivo-drawer.component.html',
    styleUrl: './personal-objetivo-drawer.component.less',
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule],
    providers: [AngularUtilService]
})
  
export class PersonalObjetivoDrawerComponent {
    PersonalId = input(0)
    PersonalNombre = signal<string>("")
    visibleObjetivo = model<boolean>(false)
    placement: NzDrawerPlacement = 'left';
    @ViewChild('personalObjetivoDrawerForm') personalObjetivoDrawerForm?: NgForm;
    periodoDesde = signal<Date | null>(null);
    periodoHasta = signal<Date | null>(null);

    constructor(private searchService: SearchService) {
        effect(onCleanup => {
            const personalId = Number(this.PersonalId());

            if (!personalId) {
                this.PersonalNombre.set('');
                return;
            }

            const subscription = this.searchService.getPersonalById(personalId).subscribe(personal => {
                if (personal?.PersonalApellido || personal?.PersonalNombre) {
                    this.PersonalNombre.set(`${personal.PersonalApellido}, ${personal.PersonalNombre}`);
                }
            });

            onCleanup(() => subscription.unsubscribe());
        });
    }

    selectedPersonalIdChange$ = new BehaviorSubject('');

    $listaAsistenciaPer = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() => {
            const personalId = Number(this.PersonalId());

            return this.searchService.getPersonalAsistencia(
                personalId,
                this.periodoDesde(),
                this.periodoHasta()
            );
        })
    );

    ngOnInit() {
        const now = new Date();
        const anio = Number(localStorage.getItem('anio')) || now.getFullYear();
        const mes = Number(localStorage.getItem('mes')) || now.getMonth() + 1;
        const periodoInicial = new Date(anio, mes - 1, 1);

        this.periodoDesde.set(periodoInicial);
        this.periodoHasta.set(periodoInicial);
    }

    selectedValueChange(): void {
        this.selectedPersonalIdChange$.next(this.PersonalId().toString());
    }
}
