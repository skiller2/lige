import { LayoutDefaultHeaderItemTriggerDirective } from '@delon/theme/layout-default';
import { TextExportService } from '@slickgrid-universal/text-export';

export class InaesAltasCsvExportService extends TextExportService {

  private headerColumns:string[] = [
    'Cuit Entidad',
    'Fecha Ingreso',
    'Cuit / Cuil / Cdi',
    'Tipo Persona',
    'Categoria',
    'Numero Asociado', //N?mero Asociado
    'Denominacion social',// Denominacion social (persona juridica)
    'Apellido', //Apellido
    'Nombre', //Nombre
    'Tipo Documento', //Tipo Documento
    'Número Documento', //N?mero Documento
    'Calle', //Calle
    'Número', //N?mero
    'Piso', // Piso
    'Departamento Edificio',// Departamento Edificio
    'ProvinciaDeptoLocalidad', // C?digo Provincia-Depto-Localidad
    'Código postal', //C?digo postal
    'Fecha de Acta', //Fecha de Acta
    'Órgano Emisor',// órgano Emisor
    'Capital Suscripto', //Capital Suscripto
    'Capital Integrado', //Capital Integrado
    'Mail', //Mail
    'Teléfono', //Telefono
    'Observación',// Observación,
    'Valor Cuota',// Valor Cuota
    'Nivel de riesgo',// "Nivel de riesgo(Bajo=1;Medio=2;Alto=3)"
    'PEP'// "PEP (SI=0;NO=1)"
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

      // console.log('headers: ', headers);
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

    const decimalColumns = new Set([
      'Capital Suscripto',
      'Capital Integrado',
      'Valor Cuota',
    ]);

    for (let row = 0; row < lineCount; row++) {
      const item = this._dataView.getItem(row);

      if (!item || item.Estado != 'A') {
        continue;
      }

      const values = columns
        .map(col => {
          if (!col) return ''
          const value = item[col.id];
          const exportHeader = col.params.exportHeader

          if (decimalColumns.has(exportHeader)) {
            return Number(value).toFixed(2).replace('.', ',');
          }

          else if (exportHeader === 'Fecha de Acta' || exportHeader === 'Fecha Ingreso') {
            return new Date(value).toLocaleDateString('en-GB');
          }

          else if (exportHeader === 'Domicilio') {
            return this.truncateBytes(String(value), 200)
          }

          else if (exportHeader === 'Apellido' || exportHeader === 'Nombre') {
            return this.truncateBytes(String(value), 100)
          }

          else if (exportHeader === 'Código postal') {
            return this.truncateBytes(String(value), 8)
          }

          else
            return value;
        });

      rows.push(values.join(this._delimiter));

    }

    return rows.join('\r\n');
  }
}