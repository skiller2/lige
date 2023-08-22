import { Component, OnInit } from '@angular/core';

@Component({
//  selector: 'app-row-preload-detail',
  templateUrl: './row-preload-detail.component.html',
//  styleUrls: ['./row-preload-detail.component.less']
  standalone:true
})
export class RowPreloadDetailComponent implements OnInit {


  ngOnInit(): void { 
    console.log('Init Preload')
  }

}


