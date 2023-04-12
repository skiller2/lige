import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, Renderer2, ViewChild } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { BehaviorSubject, catchError, debounceTime, finalize, map, Observable, switchMap, tap } from 'rxjs';
import { FormComponent } from 'src/app/shared/imagePreview/form/form.component';
import { PersonaObj, Search } from 'src/app/shared/schemas/personal.schemas';
import { SearchService } from '../search.service';
import { LoadingService, LoadingType } from '@delon/abc/loading';



@Component({
  selector: 'app-ges-credpers',
  templateUrl: './credpers.component.html',
  styles: [
    `
      @media screen and (min-width: 350px) {
        .card-inline-block {
          display: inline-block;
        }
      }

      .card-container {
        display: block;
      }

      .limit-card-columns{
        max-width: 21cm;
      }

    `
  ]
})


export class CredPersComponent implements OnInit {
  @ViewChild('credcards', { static: false }) credcards!: ElementRef;

  constructor(@Inject(DOCUMENT) private document: any, private renderer: Renderer2, private searchService: SearchService, private loadingSrv: LoadingService) { }
  ngOnInit(): void {
    /*
        for (let index = 0; index < 10; index++) {
    
          this.credentials.push({
            PersonalId: 0,
            PersonalApellido: '',
            PersonalNombre: '',
            PersonalCUITCUILCUIT: '',
            DocumentoImagenFotoBlobNombreArchivo: '',
            image: '',
            NRO_EMPRESA: '',
            DNI: '',
            CategoriaPersonalDescripcion: '',
            FechaDesde: new Date(),
            FechaHasta: new Date()
          });
        }
    */
  }
  selectedPersonalId: string = ''
  credentials: PersonaObj[] = []
  isOptionsLoading: boolean = false

  $searchChange = new BehaviorSubject('')
  $selectedValueChange = new BehaviorSubject('')
  $optionsArray: Observable<Search[]> = this.$searchChange
    .pipe(debounceTime(500))
    .pipe(
      switchMap((value) => {
        const searchfield = (Number(value)) ? 'CUIT' : 'Nombre'

        return this.searchService.getPersonFromName(searchfield, value);
      }),
    )
    .pipe(
      tap(() => this.isOptionsLoading = false)
    )

  $personalData = this.$selectedValueChange
    .pipe(
      switchMap((value) =>
        this.searchService.getInfoFromPersonalId(value)
          .pipe(tap((persona: PersonaObj) => {
            if (persona != null && persona.PersonalId > 0) {
              if (this.credentials.findIndex(obj => obj.PersonalId === persona.PersonalId) == -1)
                this.credentials.unshift(persona)
              this.selectedPersonalId = ""
            }
          }

          )

          )
          .pipe(
            finalize(() => { this.loadingSrv.close(); }),
          )

      )
    )

  selectedValueChange(event: string): void {
    if (event != "" && event != null) {
      this.$selectedValueChange.next(event)
      this.loadingSrv.open({ type: 'spin', text: '' });
    } else {
      this.loadingSrv.close();
    }
  }

  search(value: string): void {
    this.isOptionsLoading = true;
    this.$searchChange.next(value)
  }

  printCards(): void {
    const e = this.renderer.createElement("iframe");
    this.renderer.setStyle(e, "display", "none")
    this.renderer.appendChild(this.document.body, e);
    e.contentWindow.document.write(
      `<!DOCTYPE html><html><head>
       <link rel="stylesheet" href="./assets/credencial.css" >
       <title>Credencial</title>
       </head>
       <body>
       ${this.credcards.nativeElement.innerHTML}
       </body></html>`
    )
    e.contentWindow.document.close()

    setTimeout(() => {
      e.focus();
      e.contentWindow.print();
      this.renderer.removeChild(this.document.body, e);
    }, 100);

  }

}
