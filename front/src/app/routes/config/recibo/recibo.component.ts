import {
  Component, Injector, Input, ViewChild, signal
} from '@angular/core';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { BehaviorSubject} from 'rxjs';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { PersonalGrupoComponent } from '../../ges/personal-grupo/personal-grupo.component';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';



enum Busqueda {
  Personal
}

@Component({
  selector: 'app-recibo',
  standalone: true,
  imports: [
    NzInputModule,
    NzDatePickerModule,
    SHARED_IMPORTS,PersonalGrupoComponent,PersonalSearchComponent],
  templateUrl: './recibo.component.html',
  styleUrl: './recibo.component.less'
})
export class ReciboComponent {


  public get Busqueda() {
    return Busqueda;
  }

  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  @Input('PersonalId') PersonalId: number | undefined

  formChange$ = new BehaviorSubject('');
  $selectedPersonalIdChange = new BehaviorSubject('');
  selectedPeriod = { year: 0, month: 0 };
  selectedPersonalId = 0;
  $isPersonalDataLoading = new BehaviorSubject(false);

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

  
  visibleDrawer = false

  closeDrawer(): void {
    this.visibleDrawer = false;
  }
  openDrawer(): void {
    this.visibleDrawer = true
  }
}
