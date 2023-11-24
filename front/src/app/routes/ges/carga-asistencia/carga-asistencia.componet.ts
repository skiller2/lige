import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { AngularGridInstance, AngularUtilService, Column, FileType, Formatters, GridOption, SlickGrid, GroupTotalFormatters, Aggregators } from 'angular-slickgrid';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { BehaviorSubject, Observable, debounceTime, map, switchMap, tap } from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from 'src/app/shared/row-preload-detail/row-preload-detail.component';
import { SharedModule, listOptionsT } from 'src/app/shared/shared.module';
import { CustomDescargaComprobanteComponent } from '../objetivos-pendasis/objetivos-pendasis.component';
import { columnTotal, totalRecords } from "../../../shared/custom-search/custom-search"

export class CargaAsistenciaComponent {}