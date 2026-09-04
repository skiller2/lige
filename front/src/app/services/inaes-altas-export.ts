import { TextExportService } from '@slickgrid-universal/text-export';

export class InaesAltasCsvExportService extends TextExportService {

  private exportColumnIds:string[] = [
    'CUITEntidad',
    'PersonalCUITCUILCUIT',
    'PersonalFechaIngreso',
    'TipoPersona',
    // Categoria
    'PersonalNroLegajo',
    // Denominacion social (persona juridica)
    'PersonalApellido',
    'PersonalNombre',
    'TipoDocumento',
    'DNI',
    'DomicilioDomCalle',
    'DomicilioDomNro',
    // Piso
    // Departamento Edificio
    // C?digo Provincia-Depto-Localidad
    'DomicilioCodigoPostal',
    'ActaFechaActa',
    // ?rgano Emisor
    'CapitalSuscripto',
    'CapitalIntegrado',
    'PersonalEmailEmail',
    // Observaci?n,
    // Valor Cuota
    // "Nivel de riesgo(Bajo=1;Medio=2;Alto=3)"
    // "PEP (SI=0;NO=1)"
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

    // console.log('columns: ', columns);
    

    this._delimiter = ';';

    let output = '';

    // Headers without quotes
    const headers = columns
      .filter((col:any) => this.exportColumnIds.includes(col.id!))
      .map(col => col.params.exportHeader || col.name || '');

      // console.log('headers: ', headers);
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

      if (!item || item.Estado != 'A') {
        continue;
      }

      const decimalColumns = new Set([
        'CapitalSuscripto',
        'CapitalIntegrado',
      ]);

      const values = columns
        .filter((col:any) => this.exportColumnIds.includes(col.id!))
        .map(col => {
          const value = item[col.field!];

          if (decimalColumns.has(col.id!)) {
            return Number(value).toFixed(2).replace('.', ',');
          }

          else if (col.id === 'ActaFechaActa' || col.id === 'PersonalFechaNacimiento') {
            return new Date(value).toLocaleDateString('en-GB');
          }

          else if (col.id === 'Domicilio') {
            return this.truncateBytes(String(value), 200)
          }

          else if (col.id === 'DescOtrasRetenciones') {
            return this.truncateBytes(String(value), 120)
          }

          else if (col.id === 'Apellido' || col.id === 'Nombre') {
            return this.truncateBytes(String(value), 100)
          }

          else if (col.id === 'DomicilioCodigoPostal') {
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