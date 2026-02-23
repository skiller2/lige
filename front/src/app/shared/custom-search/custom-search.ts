import { AngularGridInstance, Column, Formatter } from 'angular-slickgrid';
import { createDomElement } from '@slickgrid-universal/utils';

export function columnTotal(column: string, angularGrid: AngularGridInstance) {
    let columnFooter = angularGrid.slickGrid.getFooterRowColumn(column)
    let list = angularGrid.dataView.getItems()
    if (list.length && columnFooter) {

        let columnId = angularGrid.slickGrid.getColumnIndex(column)
        let columnDetail: Column = angularGrid.slickGrid.getColumns()[columnId]
        let gridDataTotal = 0
        let totalDisplay: string

        if ((columnDetail.type == 'float' || columnDetail.type == 'number') || typeof list[0][column] === 'number') {
            for (let index = 0; index < list.length; index++) {
                gridDataTotal += list[index][column] || 0
            }

            totalDisplay = String((columnDetail.formatter) ? columnDetail.formatter(0, 0, gridDataTotal, columnDetail, null, angularGrid.slickGrid) : gridDataTotal)
            columnFooter.classList.add(String(columnDetail?.cssClass));
        } else {
            totalDisplay = list.length.toString()
        }
        columnFooter.innerHTML = totalDisplay
    }



}


export function totalRecords(angularGrid: AngularGridInstance, colid:string='') {
    const visibleColumns = angularGrid.gridService.getVisibleColumnDefinitions()
    if (visibleColumns.length == 0) return
    let colId = visibleColumns[0].id
    for (const col of visibleColumns) {
        if ('fieldName' in col) {
            colId=col.id
            break
        }
    }
    
    const columnFooter = angularGrid.slickGrid.getFooterRowColumn(colId)
    if (!columnFooter) return
    let cantData
    if (colid=='') {
        cantData = angularGrid.slickGrid.getData().getItemCount()
    } else {
    
        const items = angularGrid.slickGrid.getData().getItems().filter(row => row[colid] != '')
        cantData = items.length
    } 
    columnFooter.innerHTML = (cantData)? `Registros:  ${cantData}`:''
    columnFooter.title = columnFooter.innerHTML

}



export const appIconFormatter: Formatter = (_row, _cell, _value, columnDef) => {
    const columnParams = columnDef?.params ?? {};
    const cssClasses = columnParams.iconCssClass || columnParams.icon || columnParams.formatterIcon;
    if (columnParams.icon || columnParams.formatterIcon) {
      console.warn('[Slickgrid-Universal] deprecated params.icon or params.formatterIcon are deprecated when using `Formatters.icon` in favor of params.iconCssClass. (e.g.: `{ formatter: Formatters.icon, params: { iconCssClass: "fa fa-search" }}`');
    }
  
    if (!cssClasses) {
      throw new Error('[Slickgrid-Universal] When using `Formatters.icon`, you must provide the "iconCssClass" via the generic "params". (e.g.: `{ formatter: Formatters.icon, params: { iconCssClass: "fa fa-search" }}`');
    }
    const elem:HTMLElement = createDomElement('a', { className:cssClasses })
//    elem.setAttribute('nz-icon','')
//    elem.setAttribute('nzType',cssClasses)
//    elem.setAttribute('nzTheme','outline')
    return elem
  };


