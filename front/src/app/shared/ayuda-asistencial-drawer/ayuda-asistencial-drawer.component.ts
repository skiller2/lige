import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef,  } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { FormControl, NgForm } from '@angular/forms';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom, debounceTime,switchMap } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
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
    visible = model<boolean>(false)
    tituloDrawer = input.required<string>()

    formChange$ = new BehaviorSubject('');
    placement: NzDrawerPlacement = 'left';
    options: any[] = [];
    isSaving : boolean = false

    private apiService = inject(ApiService)
    constructor(private searchService: SearchService) { }

    async ngOnInit(): Promise<void> {
        this.options = await firstValueFrom(this.searchService.getTipoPrestamo())
    }

    async save(){
        this.isSaving = true
        try {
            let values = this.ngForm().value
            console.log('values',values);
            // const res = await firstValueFrom(this.apiService.addAyudaAsistencial(values))
        } catch (error) {
            
        }
        this.isSaving = false
    }

}