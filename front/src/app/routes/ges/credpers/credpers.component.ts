import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { BehaviorSubject, catchError, debounceTime, finalize, map, Observable, switchMap, tap } from 'rxjs';
import { FormComponent } from 'src/app/shared/imagePreview/form/form.component';
import { PersonaObj, Search } from 'src/app/shared/schemas/personal.schemas';
import { SearchService } from '../imgpers/search.service';


@Component({
  selector: 'app-ges-credpers',
  templateUrl: './credpers.component.html',
  styles: [
    `
      .card-inline-block {
        display: inline-block;
      }
      .card-container {
        display: block;
      }

    `
  ]
})


export class CredPersComponent implements OnInit {
  @ViewChild('credcards', { static: false }) credcards!: ElementRef;

  constructor(@Inject(DOCUMENT) private document: any, private searchService: SearchService) { }
  ngOnInit(): void {

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
  selectedPersonalId: string = ''
  credentials: PersonaObj[] = [];
  $isOptionsLoading = new BehaviorSubject<boolean>(false)
  $iPersonalDataLoading = new BehaviorSubject<boolean>(false)
  $isCredentialDataLoading = new BehaviorSubject<boolean>(false)

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
      tap(() => this.$isOptionsLoading.next(false))
    )

  $personalData = this.$selectedValueChange
    .pipe(
      switchMap((value) => this.searchService.getInfoFromPersonalId(value)
        .pipe(tap((value: PersonaObj) => { if (value != null) this.credentials.push(value) }

        )

        )
        .pipe(
          finalize(() => this.$iPersonalDataLoading.next(false)),
        )
      ),
    )

  selectedValueChange(event: string): void {
    this.$selectedValueChange.next(event)
    this.$iPersonalDataLoading.next(true)
  }

  search(value: string): void {
    if (value) { this.$isOptionsLoading.next(true); }
    else { this.$isOptionsLoading.next(false) }
    this.$searchChange.next(value)
  }

  printCards(): void {
    const iframe = this.document.createElement("iframe");
    iframe.style.display = 'none';

    this.document.body.appendChild(iframe);

    console.log('print', this.credcards.nativeElement.innerHTML)

    iframe.contentWindow.document.write(
      "<!DOCTYPE html><html><head>"
      + '<link rel="stylesheet" href="./assets/credencial.css" >'
      + '<title>Credencial</title>'
      + '</head>'
      + '<body>'
      + this.credcards.nativeElement.innerHTML
      + '</body></html>'
    )
    iframe.contentWindow.document.close()

    setTimeout(() => {
      iframe.focus();
      iframe.contentWindow.print();
    }, 100);

  }

}
