import { TextExportService } from '@slickgrid-universal/text-export';

export class InaesBajasCsvExportService extends TextExportService {

  private headerColumns:string[] = [
    'Cuit Entidad',
    'Cuit / Cuil / Cdi',
    'Fecha Egreso',
    'Causa Egreso',
    'Medida disciplinaria',
  ];
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

    const columnsOrderByHeader = this.headerColumns
      .map((col:string) => {
        const find = columns.find((colGrid:any) => colGrid.params?.exportHeader === col)
        if (find) return find
        return null
      });

    // Headers without quotes
    // const headers = columns
    //   .filter((col:any) => this.exportColumnIds.includes(col.id!))
    //   .map(col => col.params.exportHeader || col.name || '');

    // output += headers.join(this._delimiter);
    output += this.headerColumns.join(this._delimiter);
    output += '\r\n';

    output += this.getRows(columnsOrderByHeader);
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

      if (!item || item.Estado != 'B') {
        continue;
      }

      const values = columns
        .map(col => {
          if (!col) return ''
          const value = item[col.field!];
          
          if (col.params.exportHeader === 'Fecha Egreso') {
            return new Date(value).toLocaleDateString('en-GB');
          }
          else
            return value;
        });

      rows.push(values.join(this._delimiter));

    }

    return rows.join('\r\n');
  }
}