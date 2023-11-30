import { AngularGridInstance, Column, Formatters } from 'angular-slickgrid';

export function columnTotal(column: string, angularGrid: any) {

    let columnFooter = angularGrid.slickGrid.getFooterRowColumn(column)
    let list = angularGrid.dataView.getItems()

    if (list.length && columnFooter) {
        let columnId = angularGrid.slickGrid.getColumnIndex(column)
        let columnDetail = angularGrid.slickGrid.getColumns()[columnId]
        let gridDataTotal = 0
        let totalDisplay = ''
        if( columnDetail.type == 'float' || typeof list[0][column] === 'number' ){
            for (let index = 0; index < list.length; index++) {
                gridDataTotal += list[index][column]
            }
            totalDisplay = columnDetail.formatter(0, 0, gridDataTotal, columnDetail, null, null)
            columnFooter.style.paddingRight = '7px'
        } else {
            totalDisplay = list.length.toString()
        }
        columnFooter.innerHTML = totalDisplay
    }
}

export function totalRecords(angularGrid: any) {
    let visibleColumns = angularGrid.gridService.getVisibleColumnDefinitions()
    if (visibleColumns.length) {
        for (let index = 0; index < visibleColumns.length; index++)
            if ('fieldName' in visibleColumns[index]) {
                let columnFooter = angularGrid.slickGrid.getFooterRowColumn(visibleColumns[index].id)
                let cantData = angularGrid.slickGrid.getData().getItemCount()
                columnFooter.innerHTML = 'Registros:  ' + cantData.toString()
                break
            }
    }

}