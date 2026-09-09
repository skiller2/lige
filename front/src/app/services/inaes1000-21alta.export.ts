import { ExcelExportService } from '@slickgrid-universal/excel-export';
import {
  type ExcelColumnMetadata,
} from 'excel-builder-vanilla';

export class InaesReg1000_21AltaCsvExportService extends ExcelExportService {

  private headerColumns:any[] = [
    { columnId: 'CUITEntidad', exportHeader: 'Cuit Entidad'},
    { columnId: 'ActaFechaActa', exportHeader: 'Fecha Ingreso'},
    { columnId: 'PersonalCUITCUILCUIT', exportHeader: 'CUIT'},
    { columnId: 'TipoPersona', exportHeader: 'Tipo Persona'},
    { columnId: 'RazonSocial', exportHeader: 'Razon Social'},
    { columnId: 'PersonalApellido', exportHeader: 'Apellido'},
    { columnId: 'PersonalNombre', exportHeader: 'Nombre'},
    { columnId: 'PersonalSexo', exportHeader: 'Sexo'},
    { columnId: 'PersonalFechaNacimiento', exportHeader: 'Fecha Nacimiento'},
    { columnId: 'ProvinciaDescripcion', exportHeader: 'Provincia'},
    { columnId: 'LocalidadDescripcion', exportHeader: 'Localidad'},
    { columnId: 'DomicilioCodigoPostal', exportHeader: 'Codigo Postal'},
    { columnId: 'Domicilio', exportHeader: 'Domicilio'},
    { columnId: 'PersonalEmailEmail', exportHeader: 'Mail'},
    { columnId: 'Telefono', exportHeader: 'Teléfono'},
    { columnId: 'CapitalSuscripto', exportHeader: 'Capital Suscripto'},
    { columnId: 'CapitalIntegrado', exportHeader: 'Capital Integrado'},
    { columnId: 'PersonalNroLegajo', exportHeader: 'Nro.Legajo'},
  ];

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
  protected override async getDataOutputAsync(): Promise<Array<string[] | ExcelColumnMetadata[]>> {

    const columns = this._grid?.getColumns() || [];

    const columnsOrderByHeader = this.headerColumns.map((header) => {
      if (!header.columnId) return null;
      const column = columns.find(
        (colGrid: any) => colGrid.id === header.columnId
      );
      if (!column)return null
      return {
        ...column,
        exportHeader: header.exportHeader,
        format: header.format
      };
    });

    const outputData: Array<string[] | ExcelColumnMetadata[]> = [];

    // Header
    outputData.push(
      this.headerColumns.map((header) => header.exportHeader)
    );

    // Data
    await this.getRows(
      outputData,
      columnsOrderByHeader
    );

    return outputData;
  }

  private async getRows(
    outputData: Array<string[] | ExcelColumnMetadata[]>,
    columns: any[]
  ): Promise<void> {

    const lineCount = this._dataView.getLength();

    for (let row = 0; row < lineCount; row++) {

      const item = this._dataView.getItem(row);

      if (!item || item.Estado !== 'A') {
        continue;
      }

      const values = columns.map((column: any) => {

        if (!column) return ''

        let value = item[column.id];

        // Convert value → label using the collection
        value = this.getExportValue(value, column);

        switch (column.type) {
          case 'currency':
            value = Number(value).toFixed(2);
            break;

          case 'date':
            value = new Date(value).toLocaleDateString('en-GB');
            break;

          default:
            break;
        }

        return column.format? column.format(value) : value;
      });

      outputData.push(values);
    }
  }

}