import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { Column, FileType, AngularGridInstance, AngularUtilService, SlickGrid, FieldType, GridOption } from 'angular-slickgrid';
import { NgForm } from '@angular/forms';
import { SharedModule, listOptionsT } from '@shared';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from 'src/app/shared/row-preload-detail/row-preload-detail.component';
import { CommonModule, NgIf } from '@angular/common';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import {
  BehaviorSubject,
  debounceTime,
  map,
  switchMap,
  tap,
} from 'rxjs';

@Component({
  selector: 'app-liquidaciones',
  templateUrl: './liquidaciones.component.html',
  styleUrls: ['./liquidaciones.component.less'],
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    NzAffixModule,
    FiltroBuilderComponent,
    RowPreloadDetailComponent,
    RowDetailViewComponent,
  ],
  providers: [AngularUtilService]
})
export class LiquidacionesComponent {

  constructor(public apiService: ApiService, public router: Router, private angularUtilService: AngularUtilService) { }
  url = '/api/liquidaciones';
  url_forzado = '/api/liquidaciones/forzado';
  formChange$ = new BehaviorSubject('');



  formChanged(_event: any) {
    // this.listOptionsChange(this.listOptions)
  }

  // async ingresoPorAsistenciaAdministrativos() {
  //   this.apiService.setingresoPorAsistenciaAdministrativos().subscribe(evt => {
  //     this.formChange$.next('')
      
  //   });

  // }
  async liquidacionesAcciones(ev: Event) {

    let value = (ev.target as HTMLInputElement).id;

    switch (value) {
      case "movimientosAutomaticos":

        this.apiService.setmovimientosAutomaticos().subscribe(evt => {this.formChange$.next('')});
        break;

      case "ingresosPorAsistencia":

        this.apiService.setingresoPorAsistencia().subscribe(evt => {this.formChange$.next('')});
        break;

      case "ingresosPorAsistenciaAdministrativos":

          this.apiService.setingresoPorAsistenciaAdministrativos().subscribe(evt => {this.formChange$.next('') });
         break;

      case "ingresosArt42":

         this.apiService.setingresoArt42().subscribe(evt => {this.formChange$.next('') });
        break;

      case "ingresosCoordinadorDeCuenta":

        this.apiService.setingresosCoordinadorDeCuenta().subscribe(evt => {this.formChange$.next('') });
       break;

      case "descuentoPorDeudaAnterior":

        this.apiService.setdescuentoPorDeudaAnterior().subscribe(evt => {this.formChange$.next('') });
       break;

       case "descuentos":

       this.apiService.setdescuentos().subscribe(evt => {this.formChange$.next('') });
      break;

      case "movimientoAcreditacionEnCuenta":

      this.apiService.setdescuentos().subscribe(evt => {this.formChange$.next('') });
     break;
       
      default:
        break;
    }

  }
  
}
