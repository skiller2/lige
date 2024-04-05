import {
  Component, Injector, Input, ViewChild, signal
} from '@angular/core';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { BehaviorSubject} from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalGrupoComponent } from '../../ges/personal-grupo/personal-grupo.component';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';
import { NzMessageModule,NzMessageService } from 'ng-zorro-antd/message';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';



enum Busqueda {
  Personal
}

@Component({
  selector: 'app-recibo',
  standalone: true,
  imports: [
    NzInputModule,
    NzDatePickerModule,
    SHARED_IMPORTS,
    PersonalGrupoComponent,
    PersonalSearchComponent,
    NzMessageModule],
  templateUrl: './recibo.component.html',
  styleUrl: './recibo.component.less'
})
export class ReciboComponent {


  public get Busqueda() {
    return Busqueda;
  }

  
  constructor(
    public apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private message: NzMessageService
  ) { }

  @Input('PersonalId') PersonalId: number | undefined

  formChange$ = new BehaviorSubject('');
  $selectedPersonalIdChange = new BehaviorSubject('');
  selectedPeriod = { year: 0, month: 0 };
  selectedPersonalId = 0;
  $isPersonalDataLoading = new BehaviorSubject(false);
  headUpdate = "";
  bodyUpdate = "";
  footerUpdate = "";

  dateChange(result: Date): void {
    this.selectedPeriod.year = result.getFullYear();
    this.selectedPeriod.month = result.getMonth() + 1;

    localStorage.setItem('anio', String(this.selectedPeriod.year));
    localStorage.setItem('mes', String(this.selectedPeriod.month));

    this.formChange('');

    
  }

  formChange(event: any) {
    this.formChange$.next(event);
  }

  
  selectedValueChange(event: string, busqueda: Busqueda): void {
    switch (busqueda) {
      case Busqueda.Personal:
        this.$selectedPersonalIdChange.next(event);
        this.$isPersonalDataLoading.next(true);
        if (Number(event) > 0)
          this.router.navigate(['.', { PersonalId: event }], {
            relativeTo: this.route,
            skipLocationChange: false,
            replaceUrl: false,
          })

        return;
    }
  }

  generateRecibo(isTest:boolean){

    
     
    if(this.selectedPeriod.month == 0 ){
      this.message.create("error", `Debe seleccionar una fecha`);
      return
    }
    // if(this.selectedPersonalId == 0 ){
    //   this.message.create("error", `Debe seleccionar una persona`);
    //   return
    // }
    this.selectedPersonalId= 111
    this.apiService.updateRecibo(isTest,this.selectedPersonalId,this.selectedPeriod.month,this.selectedPeriod.year, this.headUpdate, this.bodyUpdate, this.footerUpdate)
     
  }

  
  visibleDrawer = false

  closeDrawer(): void {
    this.visibleDrawer = false;
  }
  openDrawer(): void {
    this.visibleDrawer = true
  }
}
