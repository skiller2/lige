import { ChangeDetectionStrategy, Component, effect, inject, signal, model, viewChild } from '@angular/core';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { SHARED_IMPORTS } from '@shared';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';
import { ObjetivoSearchComponent } from 'src/app/shared/objetivo-search/objetivo-search.component';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgForm } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { firstValueFrom,BehaviorSubject, } from 'rxjs';

@Component({
  selector: 'app-personal-objetivo',
  standalone: true,
  imports: [
    NzInputModule,
    NzDatePickerModule,
    SHARED_IMPORTS, PersonalSearchComponent,ObjetivoSearchComponent],
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

  dataSignal = [ { name: "", id: 0 }];

  dataEmpleados = signal(this.dataSignal);

  

  data = [
      {name:'Racing car sprays burning fuel into crowd.', id:1},
      {name:'Japanese princess to wed commoner.', id:2},
      {name:'Australian walks 100km after outback crash.', id:1},
      {name:'Los Angeles battles huge wildfires.', id:1}
      
    ];

  

  async PersonaChange(result: any): Promise<void> {

//    this.ngForm().valueChanges
   

    let resultDataEmpleados = await firstValueFrom(this.apiService.getValuePersonalObjetivo(result))
    //Deberías usar this.ngForm().form.patchValue(await this.apiService.getValuePersonalObjetivo(result))) 

    console.log("PersonaChange", result, resultDataEmpleados)


    //    this.ngForm().form.patchValue(await firstValueFrom(this.apiService.getValuesRecibo(prev)))
//    const res = await firstValueFrom(this.apiService.setRecibo(this.ngForm().value))


  }

  testbtn(){
    const res = this.apiService.getValuePersonalObjetivo(111)
  }

  
}

