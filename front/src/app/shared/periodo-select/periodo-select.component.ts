import { Component, output, ViewChild, signal, inject, ElementRef } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzDatePickerComponent } from 'ng-zorro-antd/date-picker';
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

  selectedDate = signal<Date | null>(null);
  private defaultValue: Date | null = null;

  // selKey = signal<Date | null>(null) 

  onItemChanged = new Subject<any>();    // object
 
  
  public element = inject(ElementRef);

  onChange(item: any) {
//      const selectedItem = this.optionsArray.find(option => option.TipoProductoId === item);
      this.picker?.focus()  //Al hacer click en el componente hace foco nuevamente
      this.selectedDate = item
  }

  focus() {

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
    this.selectedDate.set(this.defaultValue)
    setTimeout(() => {
      this.picker.origin.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
      this.picker.focus()  //Al hacer click en el componente hace foco

    }, 1);
  }
}
