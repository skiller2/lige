import { Component, signal, model } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { CommonModule, formatDate } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-object-viewer',
  templateUrl: './object-viewer.html',
  styleUrl: './object-viewer.less',
  imports: [SHARED_IMPORTS, NzDescriptionsModule, CommonModule,],
})
export class ObjectViewerComponent {
  data = model<any>(null);

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
}