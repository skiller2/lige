import { Component, output, ViewChild, signal, inject, ElementRef } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzDatePickerComponent } from 'ng-zorro-antd/date-picker';
import { Editor, EditorArguments } from 'angular-slickgrid';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-periodo-select',
    templateUrl: './periodo-select.component.html',
    styleUrls: ['./periodo-select.component.less'],
    imports: [...SHARED_IMPORTS]
})
export class PeriodoSelectComponent {
  @ViewChild('picker', { static: true })
  picker!: NzDatePickerComponent;

  selectedDate = signal<any>(null);
  private defaultId: any = null;

  public element = inject(ElementRef);

  onChange(value: any) {
    console.log('value: ',value);
    
    if (value) {
      // Asegura que siempre sea el primer dia del mes seleccionado
      const firstDayOfMonth = new Date(value.getFullYear(), value.getMonth(), 1)
      this.selectedDate.set(firstDayOfMonth) 
      this.defaultId = firstDayOfMonth
    } else {
      this.selectedDate.set(value)
      this.defaultId = value
    }
  }

  onKeydown(event: KeyboardEvent) {

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      event.stopImmediatePropagation()
    }
  }

  async ngOnInit() {
  }

  ngOnDestroy() {

    this.picker.origin.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this));
  }

  ngAfterViewInit() {
    this.selectedDate.set(this.defaultId)
    setTimeout(() => {
      this.picker.origin.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
      this.picker.focus()  //Al hacer click en el componente hace foco

    }, 1);
  }

}
