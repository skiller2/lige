import { TextExportService } from '@slickgrid-universal/text-export';

export class InaesRecibosCsvExportService extends TextExportService {

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

  protected encoder = new TextEncoder();
  protected decoder = new TextDecoder();

  truncateBytes(str: string, bytes: number): string {
    const buffer = new Uint8Array(bytes);
    const { written } = this.encoder.encodeInto(str, buffer);
    return this.decoder.decode(buffer.subarray(0, written));
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
      .map(col => col.params.exportHeader || col.name || '');

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

      const decimalColumns = new Set([
        'SumaRetribucion',
        'SumaExcedentes',
        'SumaMonotributoRetencion',
        'SumaOtrasRetenciones'
      ]);

      const values = columns
        .filter(col => !col.excludeFromExport)
        .map(col => {
          const value = item[col.field!];

          if (decimalColumns.has(col.id!)) {
            return Number(value).toFixed(2).replace('.', ',');
          }

          else if (col.id === 'DocumentoFecha') {
            return new Date(value).toLocaleDateString('en-GB');
          }

          else if (col.id === 'DescOtrasRetenciones') {
            return this.truncateBytes(String(value), 120)
          }

          else
            return value;
        });

      rows.push(values.join(this._delimiter));

    }

    return rows.join('\r\n');
  }
}