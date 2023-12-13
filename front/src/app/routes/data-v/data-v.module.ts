import { NgModule } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { DataVRoutingModule } from './data-v-routing.module';
import { RelationComponent } from './relation/relation.component';

const COMPONENTS = [RelationComponent];

@NgModule({
  imports: [...SHARED_IMPORTS, DataVRoutingModule],
  declarations: [...COMPONENTS]
})
export class DataVModule {}
