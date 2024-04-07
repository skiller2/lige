import {
  Component, Injector, Input, ViewChild, effect, model, signal,
  viewChild
} from '@angular/core';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { PersonalGrupoComponent } from '../../ges/personal-grupo/personal-grupo.component';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-recibo',
  standalone: true,
  imports: [
    NzInputModule,
    NzDatePickerModule,
    SHARED_IMPORTS, PersonalGrupoComponent, PersonalSearchComponent],
  templateUrl: './recibo.component.html',
  styleUrl: './recibo.component.less'
})
export class ReciboComponent {
  ngForm = viewChild.required(NgForm);
  @Input('PersonalId') PersonalId: number | undefined

  constructor(
    private router: Router,
    private route: ActivatedRoute,

  ) {
  }

  ngOnInit() {
    setTimeout(() => {
      const now = new Date()
      const anio = Number(localStorage.getItem('anio')) > 0 ? Number(localStorage.getItem('anio')) : now.getFullYear();
      const mes = Number(localStorage.getItem('mes')) > 0 ? Number(localStorage.getItem('mes')) : now.getMonth() + 1;
      this.ngForm().controls['periodo']?.setValue(new Date(anio, mes - 1, 1))

//      this.ngForm().controls['PersonalId'].setValue(this.PersonalId);
    }, 0);

  }

  formChange(event: any) {
    console.log('formChange', this.ngForm().value)
  }

  save() {
    console.log('save', this.ngForm().value)
  }

  runtest() {
    console.log('test', this.ngForm().value)
  }

}
