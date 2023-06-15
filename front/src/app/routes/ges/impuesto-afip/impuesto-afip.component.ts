import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { SharedModule } from '@shared';
import { NzResizableModule } from 'ng-zorro-antd/resizable';
import {
  NzTableSortOrder,
  NzTableSortFn,
  NzTableFilterList,
  NzTableFilterFn,
} from 'ng-zorro-antd/table';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  debounceTime,
  filter,
  fromEvent,
  map,
  of,
  switchMap,
  tap,
  throttleTime,
} from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { DescuentoJSON } from 'src/app/shared/schemas/ResponseJSON';
import { STColumn, STComponent, STData } from '@delon/abc/st';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { Options } from 'src/app/shared/schemas/filtro';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';

@Component({
  selector: 'app-impuesto-afip',
  templateUrl: './impuesto-afip.component.html',
  standalone: true,
  imports: [
    SharedModule,
    NzResizableModule,
    NzAffixModule,
    FiltroBuilderComponent,
  ],
  styleUrls: ['./impuesto-afip.component.less'],
})
export class ImpuestoAfipComponent {
  @ViewChild('impuestoForm', { static: true }) impuestoForm: NgForm =
    new NgForm([], []);
  @ViewChild('st', { static: false }) st: STComponent | undefined;

  constructor(public apiService: ApiService,private cdr: ChangeDetectorRef) {}
  selectedDate = null;
  selectedPeriodo = {
    year: 0,
    month: 0,
  };
  anio = 0;
  mes = 0;
  url = '/api/impuestos_afip';
  url_forzado = '/api/impuestos_afip/forzado';

  files: NzUploadFile[] = [];

  selectedTabIndex = 0;
  selectedPersonalId = null;
  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  stsizey = '100px';
  columns$ = this.apiService.get('/api/impuestos_afip/cols');


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

  listOptions = {
    filtros: [],
    sort: null,
  };

  toggle = false;

  listOptionsChange(options: any) {

    this.listOptions = options;
    console.log('listOptionsChange', options)
    this.cdr.detectChanges();

  }

  searchList() {
    this.toggle = !this.toggle;
    this.cdr.detectChanges();
    this.st?.reload();
  }

  listaDescuentos$ = this.formChange$.pipe(
    debounceTime(1000),
    switchMap(() => {
      this.st?.reload();
      return this.apiService
        .getDescuentoByPeriodo(
          this.anio,
          this.mes,
          this.selectedPersonalId || 0
        )
        .pipe(
          map(items => {
            if (items) if (this.selectedPersonalId == null) return items;
            return {
              Registros: items.Registros.filter(
                item => item.PersonalIdJ == parseInt(this.selectedPersonalId!)
              ),
              RegistrosConComprobantes: items.RegistrosConComprobantes,
              RegistrosSinComprobantes: items.RegistrosSinComprobantes,
            };
          }),
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => this.tableLoading$.next(false) })
        );
    })
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
      sortFn: (a: DescuentoJSON, b: DescuentoJSON) =>
        a.ApellidoNombre.localeCompare(b.ApellidoNombre),
      sortDirections: ['ascend', 'descend', null],
      filterMultiple: true,
      listOfFilter: [],
      filterFn: null,
    },
    {
      name: 'Estado',
      sortOrder: null,
      sortFn: (a: DescuentoJSON, b: DescuentoJSON) =>
        a.PersonalEstado.localeCompare(b.PersonalEstado),
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
      sortFn: (a: DescuentoJSON, b: DescuentoJSON) =>
        a.ApellidoNombre.localeCompare(b.ApellidoNombre),
      sortDirections: ['ascend', 'descend', null],
      filterMultiple: true,
      listOfFilter: [],
      filterFn: null,
    },
  ];

  resizeObservable$: Observable<Event> | undefined;
  resizeSubscription$: Subscription | undefined;

  ngOnInit() {
    this.resizeObservable$ = fromEvent(window, 'resize');
    this.resizeSubscription$ = this.resizeObservable$
      .pipe(debounceTime(500))
      .subscribe(evt => {
        //      console.log('window.innerHeight', window.innerHeight)
        // /      const height= window.innerHeight-200
        //      this.st!.scroll = { y: "${height}px" }
        //      this.st?.reset()  //Recarga la grilla
        //  this.st?._columns.
        //      this.stsizey = "${height}px"
        //      this.st?.resetColumns({})
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const now = new Date(); //date
      const anio =
        Number(localStorage.getItem('anio')) > 0
          ? localStorage.getItem('anio')
          : now.getFullYear();
      const mes =
        Number(localStorage.getItem('mes')) > 0
          ? localStorage.getItem('mes')
          : now.getMonth() + 1;
      this.impuestoForm.form
        .get('periodo')
        ?.setValue(new Date(Number(anio), Number(mes) - 1, 1));
    }, 1);

    //    this.st?.scroll()
  }

  onChangeSt(event: any): void {
    console.log('changeSt', event);
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
    //   this.formChange$.next('');
    //   //       this.msg.success(`${file.name} file uploaded successfully.`);
    // } else if (status === 'error') {
    //   //   this.msg.error(`${file.name} file upload failed.`);
    // }
  }

  formChanged(_event: string) {
    this.formChange$.next('');
  }

  ngOnDestroy() {
    this.resizeSubscription$!.unsubscribe();
  }

  getColumns(url: string): any {
    return this.apiService.get(url);
  }

  fncFile(rep: any): string {
    console.log('fncFile', rep);

    return 'pepe.pdf';
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
