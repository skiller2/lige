import { NgModule } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { ExtrasRoutingModule } from './extras-routing.module';
import { HelpCenterComponent } from './helpcenter/helpcenter.component';
import { ExtrasPoiEditComponent } from './poi/edit/edit.component';
import { ExtrasPoiComponent } from './poi/poi.component';
import { ExtrasSettingsComponent } from './settings/settings.component';

const COMPONENTS = [HelpCenterComponent, ExtrasSettingsComponent, ExtrasPoiComponent, ExtrasPoiEditComponent];

@NgModule({
  imports: [...SHARED_IMPORTS, ExtrasRoutingModule],
  declarations: [...COMPONENTS]
})
export class ExtrasModule {}
