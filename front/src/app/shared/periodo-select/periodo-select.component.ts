import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-periodo-select',
  templateUrl: './periodo-select.component.html',
  styleUrls: ['./periodo-select.component.less'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
  standalone: true,
  imports: [ ...SHARED_IMPORTS,CommonModule],

})
export class PeriodoSelectComponent {
  @Output() formChangedEvent = new EventEmitter<string>();

  formChanged(event: any) {
    this.formChangedEvent.emit(event);
  }
}
