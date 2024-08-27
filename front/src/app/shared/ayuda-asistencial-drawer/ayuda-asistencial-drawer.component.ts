import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef,  } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { FormControl, NgForm } from '@angular/forms';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom, debounceTime, switchMap, tap } from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { EditorCategoriaComponent } from 'src/app/shared/editor-categoria/editor-categoria.component';
import { InasistenciaSearchComponent } from 'src/app/shared/inasistencia-search/inasistencia-search.component';
import { PersonalSearchComponent } from '../personal-search/personal-search.component';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

export interface Option {
    label: string;
    value: string;
}
  
@Component({
    selector: 'app-ayuda-asistencial-drawer',
    standalone: true,
    imports: [SHARED_IMPORTS, NzUploadModule, NzDescriptionsModule, ReactiveFormsModule, PersonalSearchComponent, CommonModule],
    templateUrl: './ayuda-asistencial-drawer.component.html',
    styleUrl: './ayuda-asistencial-drawer.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class AyudaAsistencialDrawerComponent {
    ngForm = viewChild.required(NgForm);
    tituloDrawer = input.required<string>()
    visible = model<boolean>(false)
    refresh = model<number>(0)
    currDate = signal(new Date())
    placement: NzDrawerPlacement = 'left';
    options: any[] = [];
    isSaving = signal(false)

    private apiService = inject(ApiService)
    constructor(private searchService: SearchService) { }

    conditional = computed(async () => {
        if (!this.visible()) {
            this.ngForm().reset()
        }
    });

    formChange$ = new BehaviorSubject('');
    tableLoading$ = new BehaviorSubject(false);
    listaAdelantos$ = this.formChange$.pipe(
        debounceTime(500),
        switchMap(() =>
          this.apiService
            .getAyudaAsitencialByPersonalId({personalId: this.ngForm().form.get('personalId')?.value})
            .pipe(
              doOnSubscribe(() => this.tableLoading$.next(true)),
              tap({ complete: () => this.tableLoading$.next(false) })
            )
        )
      );

    formChange(event: any) {
        this.formChange$.next(event);
    }

    async ngOnInit(): Promise<void> {
        this.options = await firstValueFrom(this.searchService.getTipoPrestamo())
        this.currDate.set(new Date())
    }

    async save(){
        this.isSaving.set(true)
        try {
            let values = this.ngForm().value
            const res = await firstValueFrom(this.apiService.addAyudaAsistencial(values))
            this.formChange('')
            let ref = this.refresh()
            this.refresh.set(++ref)
        } catch (error) {
            
        }
        this.isSaving.set(false)
    }

}