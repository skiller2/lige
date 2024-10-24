import { CommonModule } from '@angular/common';
import { Component, output } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-periodo-select',
  templateUrl: './periodo-select.component.html',
  styleUrls: ['./periodo-select.component.less'],
//  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
  standalone: true,
  imports: [ ...SHARED_IMPORTS,CommonModule],

})
export class PeriodoSelectComponent {
  onChange = output<Date>()

  formChanged(event: any) {
    console.log('changed',event)
    this.onChange.emit(event)
    
  }
}
