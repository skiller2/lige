import { ChangeDetectionStrategy, Component, effect, inject, signal, model, viewChild } from '@angular/core';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { SHARED_IMPORTS } from '@shared';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';
import { ObjetivoSearchComponent } from 'src/app/shared/objetivo-search/objetivo-search.component';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgForm } from '@angular/forms';
import { ApiService,doOnSubscribe } from 'src/app/services/api.service';
import { firstValueFrom,BehaviorSubject,debounceTime,switchMap,tap,Observable,map,forkJoin } from 'rxjs';
import { ViewResponsableComponent } from "../../../shared/view-responsable/view-responsable.component";
import { LoadingService } from '@delon/abc/loading';
import { SearchService } from 'src/app/services/search.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';



@Component({
  selector: 'app-personal-objetivo',
  standalone: true,
  imports: [
    NzInputModule,
    NzDatePickerModule,
    SHARED_IMPORTS, PersonalSearchComponent,ObjetivoSearchComponent,ViewResponsableComponent,CommonModule,DetallePersonaComponent],
  templateUrl: './personal-objetivo.component.html',
  styleUrl: './personal-objetivo.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class PersonalObjetivoComponnet {
  //formChange$ = new BehaviorSubject('');
  ngForm = viewChild.required(NgForm);
  private apiService = inject(ApiService)
  PersonalId = model.required()
  tabIndex = 0
  userId = 0
  ObjetivoId = 0
  addMoreGroup: boolean = false;
  addMoreUser: boolean = false;
  valuesMapObjetivo = []
  valuesMapPersonal = []
  ObjetivoIdForAdd = 0
  PersonaIdForAdd = 0
  $selectedObjetivoIdChange = new BehaviorSubject(0);
  objetivoResponsablesLoading$ = new BehaviorSubject<boolean | null>(null);
  contratos: any[] = []
  objetivoInfo: any = {}
  selectedSucursalId = 0
  visibleDrawer: boolean = false

  fechaActual = new Date();
  mes = this.fechaActual.getMonth() + 1; // Agrega 1 porque los meses se indexan desde 0 (0 = enero)
  anio = this.fechaActual.getFullYear();
  
  private readonly route = inject(ActivatedRoute);
  public router = inject(Router)
  private readonly loadingSrv = inject(LoadingService);
  private searchService = inject(SearchService)
  data: { id: number; Descripcion: string }[] = [];
  dataGrupos = signal(this.data);
  dataEmpleados = signal(this.data);

  async PersonaChange(result: any): Promise<void> {

    this.userId = result
    this.personalMap()
    this.addMoreGroup = true
  
  }

  async personalMap(){
    let newValues = await firstValueFrom(this.apiService.getValueObjetivo(this.userId));
    this.valuesMapObjetivo  = newValues[0].map((valor: any) => ({
      id: valor.id,
      Descripcion: valor.Descripcion
    }));
    this.dataEmpleados.set(this.valuesMapObjetivo)
  }

  async ObjtivoChange(result: any): Promise<void> {
   
    this.ObjetivoId = result
    this.groupMap()
    this.addMoreUser = true

    if (this.ObjetivoId > 0) {
      this.router.navigate(['.', { ObjetivoId: this.ObjetivoId }], {
          relativeTo: this.route,
          skipLocationChange: false,
          replaceUrl: false,
      })
      this.selectedSucursalId = this.objetivoInfo?.SucursalId
    }

  this.$selectedObjetivoIdChange.next(this.ObjetivoId);
  //this.$isObjetivoDataLoading.next(true);

  }

  async groupMap(){
    let newValues = await firstValueFrom(this.apiService.getValuePersona(this.ObjetivoId ));
    this.valuesMapPersonal  = newValues[0].map((valor: any) => ({
      id: valor.id,
      Descripcion: valor.Descripcion
    }));
    this.dataGrupos.set(this.valuesMapPersonal)
  }

  async setValueObjetivo(newValues:any){
    this.valuesMapObjetivo  = newValues[0].map((valor: any) => ({
      id: valor.id,
      Descripcion: valor.Descripcion
    }));
  }

  async groupDelete(ObjetivoId:any): Promise<void> {

    await firstValueFrom(this.apiService.setPersonalAndGroupDelete(this.userId,ObjetivoId))
    let newResult = this.valuesMapObjetivo.filter((item: any) => item.id !== ObjetivoId)
    this.valuesMapObjetivo = newResult
    this.dataEmpleados.set(this.valuesMapObjetivo)
  }

  async UserDelete(userid:any): Promise<void> {
    
    await firstValueFrom(this.apiService.setPersonalAndGroupDelete(userid,this.ObjetivoId))
    let newResult = this.valuesMapPersonal.filter((item: any) => item.id !== userid)
    this.valuesMapPersonal = newResult
    this.dataGrupos.set(this.valuesMapPersonal)
  }

  async addgroup(): Promise<void> {
   
    await firstValueFrom(this.apiService.setPersonaAndGroup(this.userId,this.ObjetivoIdForAdd ));
    this.personalMap()

  }

  async restarVariablesPersona() {
    this.addMoreGroup = false;
    this.dataEmpleados.set(this.data)
  }
  
  async restarVariablesGroup() {
    this.addMoreUser = false;
    this.dataGrupos.set(this.data)
  }

  async addPersona(): Promise<void> {
   
    await firstValueFrom(this.apiService.setPersonaAndGroup(this.PersonaIdForAdd,this.ObjetivoId));
    this.groupMap()

  }

  $objetivoDetalle = this.$selectedObjetivoIdChange.pipe(
    debounceTime(50),
    switchMap(objetivoId => {
        return this.getObjetivoDetalle(objetivoId, this.anio, this.mes)
            .pipe(
                doOnSubscribe(() => this.objetivoResponsablesLoading$.next(true)),
                tap({
                    complete: () => { this.objetivoResponsablesLoading$.next(false) },
                })
            );
    })
  );

  getObjetivoDetalle(objetivoId: number, anio: number, mes: number): Observable<any> {
      this.loadingSrv.open({ type: 'spin', text: '' })
      return forkJoin([
          this.searchService.getObjetivoResponsables(objetivoId, anio, mes),
          this.searchService.getObjetivoContratos(objetivoId, anio, mes),
      ]).pipe(
          map((data: any[]) => {
              this.loadingSrv.close()
              this.contratos = data[1]
              return { responsable: data[0], contratos: data[1], periodo: data[2] };
          })
      );
    }

    openDrawer(): void {
     
      if (this.userId == 0) return
      this.visibleDrawer = true
  }

  closeDrawer(): void {
    this.visibleDrawer = false;
}

  
}

