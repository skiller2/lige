import { AngularGridInstance } from 'angular-slickgrid';

export function columnTotal(column: string, angularGrid: any) {

    let columnFooter = angularGrid.slickGrid.getFooterRowColumn(column)
    if (columnFooter) {
        //let columnId = angularGrid.slickGrid.getColumnIndex(column)
        //let columnDetail = angularGrid.slickGrid.getColumns()[columnId]

        let list = angularGrid.dataView.getItems()
        let totalDisplay = ''
        if(typeof list[0][column] === 'number'){
            let gridDataTotal = 0
            for (let index = 0; index < list.length; index++) {
                gridDataTotal += list[index][column]
            }
            totalDisplay = 'Total: '+ gridDataTotal.toFixed(2)
        }else {
            let cantData = angularGrid.slickGrid.getData().getItemCount()
            totalDisplay = cantData.toString()
        }
        columnFooter.innerHTML = totalDisplay
    } else if(column == 'registros'){
        let visibleColumns = angularGrid.gridService.getVisibleColumnDefinitions()
        for (let index = 0; index < visibleColumns.length; index++)
            if('fieldName' in visibleColumns[index]){
                columnFooter = angularGrid.slickGrid.getFooterRowColumn(visibleColumns[index].id)
                break
            }
        let cantData = angularGrid.slickGrid.getData().getItemCount()
        columnFooter.innerHTML = 'Registros:  ' + cantData.toString()
    }
    
}