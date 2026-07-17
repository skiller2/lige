import { Component, input, model } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-column-comparison-search',
  templateUrl: './column-comparison-search.html',
  imports: [...SHARED_IMPORTS]
})
export class ColumnComparisonSearchComponent {
  readonly compareFieldLabel = input('otra columna');
  readonly operador = model('=');
  readonly operators = ['=', '>=', '<=', '<', '>'];
}
