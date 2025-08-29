import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import  { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import { Component, inject, ChangeDetectionStrategy,ViewEncapsulation } from '@angular/core';
import { NgForm, FormArray, FormBuilder, ValueChangeEvent } from '@angular/forms';
import { SearchService } from 'src/app/services/search.service';
import { BehaviorSubject } from 'rxjs';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { ApiService } from 'src/app/services/api.service';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-novedades-form',
  imports: [  SHARED_IMPORTS, CommonModule, FileUploadComponent, ObjetivoSearchComponent, NzSelectModule, NzAutocompleteModule, FormsModule],
  templateUrl: './novedades-form.html',
  styleUrl: './novedades-form.less',
  providers: [ApiService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NovedadesFormComponent {
  public router = inject(Router);
  $selectedObjetivoIdChange = new BehaviorSubject(0);
  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  $optionsTipoNovedad = this.searchService.getTipoNovedad();

 fb = inject(FormBuilder)
  formCli = this.fb.group({
    ObjetivoId: 0,
    FechaNovedad: null,
    TipoNovedadId: 0,
    Descripcion: '',
    Accion: '',
    files: []

  })

  objetivoDetalleChange(event: any){
    this.$selectedObjetivoIdChange.next(event)
  }

}
