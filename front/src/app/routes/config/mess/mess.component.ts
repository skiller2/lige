import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from 'src/app/shared/row-preload-detail/row-preload-detail.component';

@Component({
  selector: 'app-mess',
  standalone: true,
  imports: [NzModalModule,
    CommonModule,
    SHARED_IMPORTS,
    NzAffixModule,
    FiltroBuilderComponent,
    RowPreloadDetailComponent,
    RowDetailViewComponent,
    NzUploadModule
  ],
  templateUrl: './mess.component.html',
  styleUrl: './mess.component.less'
})
export class MessComponent {
  messInfo = signal({'msg':'descansando'})
  private apiService = inject(ApiService)
  async getMessInfo() {
    try {
      this.messInfo.set(await firstValueFrom(this.apiService.getMessInfo()))
    } catch (e) {
      console.log(e)
      this.messInfo.set({'msg':'error'})
    }
  }
}