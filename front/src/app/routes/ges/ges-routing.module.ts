import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { GesCcfarmComponent } from './ccfarm/ccfarm.component';
import { ImgPersComponent } from './imgpers/imgpers.component';

const routes: Routes = [{ path: 'ccfarm', component: GesCcfarmComponent }, { path: 'imgpers', component: ImgPersComponent}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GesRoutingModule {}
