import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SharedModule } from '@shared';
import { NzTableSortOrder, NzTableSortFn, NzTableFilterList, NzTableFilterFn } from 'ng-zorro-antd/table';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';
import { BehaviorSubject, Observable, debounceTime, filter, map, switchMap, tap, throttleTime } from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { DescuentoJSON, ResponseDescuentos } from 'src/app/shared/schemas/ResponseJSON';

@Component({
  selector: 'app-impuesto-afip',
  templateUrl: './impuesto-afip.component.html',
  standalone: true,
  imports: [SharedModule],
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
          if (items) if (this.selectedPersonalId == null) return items;
          return {
            Registros: items.Registros.filter(
              item =>
                item.PersonalId == parseInt(this.selectedPersonalId!) || item.PersonalIdJ == parseInt(this.selectedPersonalId!)
            ),
            RegistrosConComprobantes: items.RegistrosConComprobantes,
          };
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
  downloadAction$ = new BehaviorSubject<null | DescuentoJSON>(null);
  downloadComprobante(data: DescuentoJSON) {
    this.downloadAction$.next(data);
    // this.apiService.downloadComprobante(data.CUIT, data.PersonalId, this.anio, this.mes).subscribe();
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      const now = new Date(); //date
      const anio = Number(localStorage.getItem('anio')) > 0 ? localStorage.getItem('anio') : now.getFullYear();

      const mes = Number(localStorage.getItem('mes')) > 0 ? localStorage.getItem('mes') : now.getMonth() + 1;

      this.impuestoForm.form.get('periodo')?.setValue(new Date(Number(anio), Number(mes) - 1, 1));
    }, 1);
    this.downloadAction$.pipe(throttleTime(3000)).subscribe(data => {
      if (data) {
        this.apiService.downloadComprobante(data.CUIT, data.PersonalId, this.anio, this.mes).subscribe();
      }
    });


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
  }

  ngOnDestroy() {
    this.downloadAction$.unsubscribe();
  }
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
