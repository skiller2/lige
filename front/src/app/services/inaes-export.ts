import { TextExportService } from '@slickgrid-universal/text-export';
//import type { Column } from '@slickgrid-universal/common';

export class InaesCsvExportService extends TextExportService {

  /**
   * Format exported values
   */
  protected formatExportValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'number') {
      return value.toFixed(2).replace('.', ',');
    }

    return String(value)
      .replace(/\r/g, '')
      .replace(/\n/g, ' ');
  }

  /**
   * Override complete output generation
   */
  protected override getDataOutput(): string {
    
    const columns = this._grid.getColumns() || [];

    this._delimiter = ';';

    let output = '';

    // Headers without quotes
    const headers = columns
      .filter(col => !col.excludeFromExport)
      .map(col => col.name || '');

    output += headers.join(this._delimiter);
    output += '\r\n';

    output += this.getRows(columns);
    return output;
  }

  /**
   * Export rows
   */
  protected getRows(columns: any[]): string {
    const rows: string[] = [];

    const lineCount = this._dataView.getLength();

    for (let row = 0; row < lineCount; row++) {
      const item = this._dataView.getItem(row);

      if (!item) {
        continue;
      }
      const values = columns
        .filter(col => !col.excludeFromExport)
        .map(col => {
          const value = item[col.field!];
          if (col.id == "SumaRetribucion" || col.id =="SumaExcedentes"|| col.id =="SumaMonotributoRetencion"|| col.id =="SumaOtrasRetenciones")
            return value.toFixed(2).replace('.', ',')
        else if (col.id == "DocumentoFecha") 
            return new Date(value).toLocaleDateString('en-GB');
        else 
            return value 
        });

      rows.push(values.join(this._delimiter));
    }

    return rows.join('\r\n');
  }
}