import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NzTableSortOrder, NzTableSortFn, NzTableFilterList, NzTableFilterFn } from 'ng-zorro-antd/table';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';
import { BehaviorSubject, debounceTime, filter, map, switchMap, tap } from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { DescuentoJSON } from 'src/app/shared/schemas/ResponseJSON';

@Component({
  selector: 'app-impuesto-afip',
  templateUrl: './impuesto-afip.component.html',
  styleUrls: ['./impuesto-afip.component.less'],
})
export class ImpuestoAfipComponent {
  @ViewChild('impuestoForm', { static: true }) impuestoForm: NgForm = new NgForm([], []);

  constructor(private apiService: ApiService) {}
  selectedDate = null;
  anio = 0;
  mes = 0;
  url = '/api/impuestos_afip';
  files: NzUploadFile[] = [];

  selectedPersonalId = null;
  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);

  options = {
    CUIT: {
      searchValue: '',
      visible: false,
    },
    Nombre: {
      searchValue: '',
      visible: false,
    },
  };

  listaDescuentos$ = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() =>
      this.apiService.getDescuentoByPeriodo(this.anio, this.mes).pipe(
        map(items => {
          if (this.selectedPersonalId == null) return items;
          return items.filter(
            item => item.PersonalId == parseInt(this.selectedPersonalId!) || item.PersonalIdJ == parseInt(this.selectedPersonalId!)
          );
        }),
        doOnSubscribe(() => this.tableLoading$.next(true)),
        tap({ complete: () => this.tableLoading$.next(false) })
      )
    )
  );
  listOfColumns: ColumnItem[] = [
    {
      name: 'CUIT',
      sortOrder: null,
      sortDirections: ['ascend', 'descend', null],
      sortFn: (a: DescuentoJSON, b: DescuentoJSON) => a.CUIT - b.CUIT,
      filterMultiple: false,
      listOfFilter: [],
      filterFn: (CUIT: number, item: DescuentoJSON) => item.CUIT === CUIT,
    },
    {
      name: 'Apellido, Nombre',
      sortOrder: null,
      sortFn: (a: DescuentoJSON, b: DescuentoJSON) => a.ApellidoNombre.localeCompare(b.ApellidoNombre),
      sortDirections: ['ascend', 'descend', null],
      filterMultiple: true,
      listOfFilter: [],
      filterFn: null,
    },
    {
      name: 'Estado',
      sortOrder: null,
      sortFn: (a: DescuentoJSON, b: DescuentoJSON) => a.PersonalEstado.localeCompare(b.PersonalEstado),
      sortDirections: ['ascend', 'descend', null],
      filterMultiple: true,
      listOfFilter: [],
      filterFn: null,
    },
    {
      name: 'Monto',
      sortOrder: 'descend',
      sortFn: (a: DescuentoJSON, b: DescuentoJSON) => a.monto! - b.monto!,
      sortDirections: ['descend', null],
      listOfFilter: [],
      filterFn: null,
      filterMultiple: true,
    },
    {
      name: 'CUIT (J)',
      sortOrder: null,
      sortDirections: ['ascend', 'descend', null],
      sortFn: (a: DescuentoJSON, b: DescuentoJSON) => a.CUIT - b.CUIT,
      filterMultiple: false,
      listOfFilter: [],
      filterFn: (CUIT: number, item: DescuentoJSON) => item.CUIT === CUIT,
    },
    {
      name: 'Apellido, Nombre (J)',
      sortOrder: null,
      sortFn: (a: DescuentoJSON, b: DescuentoJSON) => a.ApellidoNombre.localeCompare(b.ApellidoNombre),
      sortDirections: ['ascend', 'descend', null],
      filterMultiple: true,
      listOfFilter: [],
      filterFn: null,
    },
  ];

  ngAfterViewInit(): void {
    setTimeout(() => {
      const now = new Date(); //date
      const anio = Number(localStorage.getItem('anio')) > 0 ? localStorage.getItem('anio') : now.getFullYear();

      const mes = Number(localStorage.getItem('mes')) > 0 ? localStorage.getItem('mes') : now.getMonth() + 1;

      this.impuestoForm.form.get('periodo')?.setValue(new Date(Number(anio), Number(mes) - 1, 1));
    }, 1);
  }

  onChange(result: Date): void {
    if (result) {
      this.anio = result.getFullYear();
      this.mes = result.getMonth() + 1;

      localStorage.setItem('mes', String(this.mes));
      localStorage.setItem('anio', String(this.anio));
    } else {
      this.anio = 0;
      this.mes = 0;
    }

    this.formChange$.next('');
    this.files = [];
  }

  handleChange({ file, fileList }: NzUploadChangeParam): void {
    // const status = file.status;
    // if (status !== 'uploading') {
    //   console.log(file, fileList);
    // }
    // if (status === 'done') {
    //   this.msg.success(`${file.name} file uploaded successfully.`);
    // } else if (status === 'error') {
    //   this.msg.error(`${file.name} file upload failed.`);
    // }
  }

  formChanged(event: string) {
    this.formChange$.next('');
    console.log(event);
  }
  // downloadComprobante(cuit: number, personalId: number) {
  //   this.apiService.downloadComprobante(cuit, personalId, this.anio, this.mes).subscribe();
  // }
}

interface ColumnItem {
  name: string;
  sortOrder: NzTableSortOrder | null;
  sortFn: NzTableSortFn<any> | null;
  listOfFilter: NzTableFilterList;
  filterFn: NzTableFilterFn<any> | null;
  filterMultiple: boolean;
  sortDirections: NzTableSortOrder[];
}
