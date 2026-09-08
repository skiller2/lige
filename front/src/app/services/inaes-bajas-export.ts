import { TextExportService } from '@slickgrid-universal/text-export';

export class InaesBajasCsvExportService extends TextExportService {

  private headerColumns:any[] = [
    { columnId: 'CUITEntidad', exportHeader: 'Cuit Entidad'},
    { columnId: 'PersonalCUITCUILCUIT', exportHeader: 'Cuit / Cuil / Cdi'},
    { columnId: 'ActaFechaActa', exportHeader: 'Fecha Egreso'},
    { columnId: 'PersonalSituacionRevistaMotivo', exportHeader: 'Causa Egreso'},
    { columnId: null, exportHeader: 'Medida disciplinaria'},
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
    const columnsOrderByHeader = this.headerColumns
      .map((col:any) => {
        if (!col.columnId) return null
        const find = columns.find((colGrid:any) => colGrid.id === col.columnId)
        if (find) return {...find, format: col.format}
        return null
      });

    this._delimiter = ';';

    let output = '';
      
    output += this.headerColumns.map(obj => obj.exportHeader).join(this._delimiter);
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
        .map((obj:any) => {
          if (!obj) return ''
          
          let value = item[obj.id];

          switch (obj.type) {
            case 'currency':
              value = Number(value).toFixed(2).replace('.', ',');
              break;
            case 'date':
              value = new Date(value).toLocaleDateString('en-GB');
              break;

            default:
              break;
          }

          return obj.format? obj.format(value) : value;
        });

      rows.push(values.join(this._delimiter));

    }

    return rows.join('\r\n');
  }
}