import { TextExportService } from '@slickgrid-universal/text-export';

export class InaesAltasCsvExportService extends TextExportService {

  private headerColumns:any[] = [
    { columnId: 'CUITEntidad', exportHeader: 'Cuit Entidad'},
    { columnId: 'ActaFechaActa', exportHeader: 'Fecha Ingreso'},
    { columnId: 'PersonalCUITCUILCUIT', exportHeader: 'Cuit / Cuil / Cdi'},
    { columnId: 'TipoPersona', exportHeader: 'Tipo Persona'},
    { columnId: null, exportHeader: 'Categoria'},
    { columnId: 'PersonalNroLegajo', exportHeader: 'Numero Asociado'},
    { columnId: null, exportHeader: 'Denominacion social'},
    { columnId: 'PersonalApellido', exportHeader: 'Apellido', format: (value:any)=>{return this.truncateBytes(String(value), 100)}},
    { columnId: 'PersonalNombre', exportHeader: 'Nombre', format: (value:any)=>{return this.truncateBytes(String(value), 100)}},
    { columnId: 'TipoDocumento', exportHeader: 'Tipo Documento'},
    { columnId: 'DNI', exportHeader: 'Número Documento'},
    { columnId: 'DomicilioDomCalle', exportHeader: 'Calle'},
    { columnId: 'DomicilioDomNro', exportHeader: 'Número'},
    { columnId: null, exportHeader: 'Piso'},
    { columnId: null, exportHeader: 'Departamento Edificio'},
    { columnId: 'ProvinciaINAES', exportHeader: 'ProvinciaDeptoLocalidad'},
    { columnId: 'DomicilioCodigoPostal', exportHeader: 'Código postal'},
    { columnId: 'ActaFechaActa', exportHeader: 'Fecha de Acta'},
    { columnId: null, exportHeader: 'Órgano Emisor'},
    { columnId: 'CapitalSuscripto', exportHeader: 'Capital Suscripto'},
    { columnId: 'PersonalEmailEmail', exportHeader: 'Mail'},
    { columnId: 'Telefono', exportHeader: 'Teléfono'},
    { columnId: null, exportHeader: 'Observación'},
    { columnId: 'ValorCuota', exportHeader: 'Valor Cuota'},
    { columnId: 'NivelRiesgo', exportHeader: 'Nivel de riesgo'},
    { columnId: 'PEP', exportHeader: 'PEP'},
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

      if (!item || item.Estado != 'A') {
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