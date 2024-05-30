
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy,effect,EventEmitter, model,Input, Output, inject, viewChild } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NgForm } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';





@Component({
  selector: 'app-licencia-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS,NzDescriptionsModule],
  templateUrl: './licencia-drawer.component.html',
  styleUrl: './licencia-drawer.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class LicenciaDrawerComponent {

  ngForm = viewChild.required(NgForm);
  //visible = false;
  placement: NzDrawerPlacement = 'left';
  visibleDrawer: boolean = false

  @Output() onClose = new EventEmitter<boolean>();
  @Input() data = [];
  private apiService = inject(ApiService)
  
    
  @Input()
  set visible(value: boolean) {
    this.visibleDrawer = value;
    if (this.visibleDrawer)
      this.load()
  }

  async load() {
    setTimeout(async () => {
      console.log("llegue al componente drager con el valor", this.data)
console.log(this.data)
      let {PersonalId, PersonalLicenciaId} = this.data[0];
      this.ngForm().form.patchValue(await firstValueFrom(this.apiService.getValuesdrawerLicencia(PersonalId,PersonalLicenciaId)))
   
    }, 0);
   
  }

  get visible(): boolean {
    return this.visibleDrawer
  }


  // ngOnInit(): void {
  //      this.load(false)
  //     }
    
  closeDrawer(): void {
        this.visible = false
        this.onClose.emit(this.visibleDrawer)
      }
}
