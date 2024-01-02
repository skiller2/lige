import { AngularGridInstance, Column } from 'angular-slickgrid';

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

            columnFooter.style.paddingRight = '1px'
            columnFooter.classList.add(String(columnDetail.cssClass));
        } else {
            totalDisplay = list.length.toString()
        }
        columnFooter.innerHTML = totalDisplay
        console.log('columnFooter.innerHTML', totalDisplay)
    }



}

export function totalRecords(angularGrid: AngularGridInstance) {
    const visibleColumns = angularGrid.gridService.getVisibleColumnDefinitions()
    if (visibleColumns.length == 0) return
    let added = false
    for (const col of visibleColumns) {
        if ('fieldName' in col) {
            let columnFooter = angularGrid.slickGrid.getFooterRowColumn(col.id)
            let cantData = angularGrid.slickGrid.getData().getItemCount()
            columnFooter.innerHTML = `Registros:  ${cantData}`
            added = true
            break
        }
    }
    if (!added) {
        const col = visibleColumns[0]
        let columnFooter = angularGrid.slickGrid.getFooterRowColumn(col.id)
        let cantData = angularGrid.slickGrid.getData().getItemCount()
        columnFooter.innerHTML = `Registros:  ${cantData}`
    }

}