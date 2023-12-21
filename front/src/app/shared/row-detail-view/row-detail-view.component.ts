import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { AngularGridInstance, Column, SlickDataView, SlickGrid } from 'angular-slickgrid';

@Component({
//  selector: 'app-row-detail-view',
  templateUrl: './row-detail-view.component.html',
//  styleUrls: ['./row-detail-view.component.less']
  standalone: true,
  imports: [ ...SHARED_IMPORTS,CommonModule],


})
export class RowDetailViewComponent implements OnInit {

  addon: any; // row detail addon instance
  grid!: SlickGrid;
  dataView!: SlickDataView;
  model: any
  parent: any
  columnsDefinition: Column[] =[]
  constructor() { }
  
  ngOnInit(): void { 
    this.columnsDefinition = this.parent.angularGrid.gridService.getAllColumnDefinitions().filter((data: Column) => data.name != '')
    const angularGrid:AngularGridInstance =this.parent.angularGrid

    //console.log('this.columnsDefinition',this.parent.angularGrid.gridService.getAllColumnDefinitions())
  }

}
