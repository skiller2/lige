import { TextExportService } from '@slickgrid-universal/text-export';
import { ExportError } from '../shared/utils/export-error';

export class InaesReg1000_21AltaCsvExportService extends TextExportService {

  private headerColumns: any[] = [
    { columnId: 'CUITEntidad', exportHeader: 'Cuit Entidad' },
    { columnId: 'ActaFechaActa', exportHeader: 'Fecha Ingreso' },
    { columnId: 'PersonalCUITCUILCUIT', exportHeader: 'CUIT' },
    { columnId: 'TipoPersona', exportHeader: 'Tipo Persona' },
    { columnId: 'RazonSocial', exportHeader: 'Razon Social' },
    { columnId: 'PersonalApellido', exportHeader: 'Apellido' },
    { columnId: 'PersonalNombre', exportHeader: 'Nombre' },
    { columnId: 'PersonalSexo', exportHeader: 'Sexo' },
    { columnId: 'PersonalFechaNacimiento', exportHeader: 'Fecha Nacimiento' },
    { columnId: 'ProvinciaDescripcion', exportHeader: 'Provincia' },
    { columnId: 'LocalidadDescripcion', exportHeader: 'Localidad' },
    { columnId: 'DomicilioCodigoPostal', exportHeader: 'Codigo Postal' },
    { columnId: 'Domicilio', exportHeader: 'Domicilio' },
    { columnId: 'PersonalEmailEmail', exportHeader: 'Mail' },
    { columnId: 'Telefono', exportHeader: 'Teléfono' },
    { columnId: 'CapitalSuscripto', exportHeader: 'Capital Suscripto' },
    { columnId: 'CapitalIntegrado', exportHeader: 'Capital Integrado' },
    { columnId: 'PersonalNroLegajo', exportHeader: 'Nro.Legajo' },
  ];

  private errors: string[] = [];

  private getExportValue(value: any, column: any): any {
    if (column.params?.collection) {
      const option = column.params.collection.find(
        (item: any) => item.value == value
      );

      return option?.label ?? value;
    }

    return value;
  }
  /**
   * Format exported values
   */
  protected override getDataOutput(): string {
    this.errors = []
    const columns = this._grid.getColumns() || [];
    const columnsOrderByHeader = this.headerColumns
      .map((col: any) => {
        if (!col.columnId) return null
        const find = columns.find((colGrid: any) => colGrid.id === col.columnId)
        if (find) return { ...find, format: col.format }
        return null
      });

    this._delimiter = ';';

    const headerTxt = this.headerColumns.map(obj => obj.exportHeader).join(this._delimiter) + '\r\n';
    const rowsTxt = this.getRows(columnsOrderByHeader);

    if (rowsTxt.trim() === '')
      throw new ExportError('No existen datos para exportar');

    if (this.errors.length > 0) {
      let errorMsg = `No se puede exportar hay ${this.errors.length} campos con información faltante.\n${this.errors.join('\n')}`
      throw new ExportError(errorMsg)
    }

    return headerTxt + rowsTxt;
  }



  protected getRows(columns: any[]): string {
    const rows: string[] = [];

    const lineCount = this._dataView.getLength();

    for (let row = 0; row < lineCount; row++) {
      const item = this._dataView.getItem(row);

      if (!item || item.Estado != 'A') {
        continue;
      }

      const values = columns
        .map((obj: any) => {
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

          if (value === null || value === undefined || value === '')
            this.errors.push(`Registro ${row + 1}: ${item.PersonalApellido} ${item.PersonalNombre} - Columna "${obj.name}" vacío.`);

          return obj.format ? obj.format(value) : value;
        });

      rows.push(values.join(this._delimiter));

    }

    return rows.join('\r\n');
  }
}