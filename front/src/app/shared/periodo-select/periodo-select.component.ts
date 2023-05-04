import { Component, EventEmitter, Output } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';

@Component({
  selector: 'app-periodo-select',
  templateUrl: './periodo-select.component.html',
  styleUrls: ['./periodo-select.component.less'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
})
export class PeriodoSelectComponent {
  @Output() formChangedEvent = new EventEmitter<string>();

  formChanged(event: string) {
    this.formChangedEvent.emit(event);
  }
}
