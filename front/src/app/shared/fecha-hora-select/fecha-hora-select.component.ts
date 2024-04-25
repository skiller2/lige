import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core'
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms'
import { NzSelectComponent } from 'ng-zorro-antd/select'
import { SHARED_IMPORTS } from '@shared'
import { CommonModule } from '@angular/common'

@Component({
    selector: 'app-fecha-hora-select',
    templateUrl: './fecha-hora-select.component.html',
    styleUrls: ['./fecha-hora-select.component.less'],
    standalone: true,
    imports: [ ...SHARED_IMPORTS,CommonModule],
    
  })

export class FechaHoraSelectComponent{
    @Input() valueExtended: any
    @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
    @ViewChild("fhsc") fhsc!: NzSelectComponent

    selectedId: any = null
    selectedItem: any;
  
    onChange(value: Date): void {
      this.selectedId = value
      this.selectedItem = { id:value, date: value }
    }
  
    ngOnDestroy() { 
      this.fhsc.originElement.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this))
    }

    onKeydown(event: KeyboardEvent) {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
          event.stopImmediatePropagation()
        }
      }
    
    ngAfterViewInit() {
      // setTimeout(() => {
      //   this.fhsc.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
      //   this.fhsc.focus()  //Al hacer click en el componente hace foco
      // }, 1);
    }
    
      writeValue(value: Date) {
        if (value !== this.selectedId) {
          this.selectedId = value
        }
      }
    
      modelChange(value: Date) {
        this.selectedId = value;
      }
  }