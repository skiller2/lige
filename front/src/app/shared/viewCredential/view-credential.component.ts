import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, forwardRef, Inject, Input, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PersonaObj } from '../schemas/personal.schemas';
@Component({
    selector: 'app-view-credential',
    templateUrl: './view-credential.component.html',
    styleUrls: ['./view-credential.component.css', '../../../assets/credencial.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ViewCredentialComponent),
            multi: true
        }],
    //    encapsulation: ViewEncapsulation.ShadowDom
})
export class ViewCredentialComponent implements ControlValueAccessor {
    personal: PersonaObj = {
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
    }
    faltantes: boolean = true

    @ViewChild('credcard', { static: false }) credIframe!: ElementRef<HTMLInputElement>;;
    @Input('showPrintBtn') showPrintBtn: boolean = true;


    constructor(@Inject(DOCUMENT) private document: any) { }

    writeValue(value: PersonaObj) {
        if (value) {
            this.personal = value;
        }
        this.faltantes = (this.personal.PersonalCUITCUILCUIT && this.personal.image)?false:true    
        
        
    }

    registerOnChange(fn: (_: any) => void) { }

    registerOnTouched() { }

    printCard() {
        const iframe = this.document.createElement("iframe");
        iframe.style.display = 'none';

        this.document.body.appendChild(iframe);

        iframe.contentWindow.document.write(
            "<!DOCTYPE html><html><head>"
            + '<link rel="stylesheet" href="./assets/credencial.css" >'
            + '<title>Credencial</title>'
            + '</head>'
            + '<body>'
            + this.credIframe.nativeElement.innerHTML
            + '</body></html>'
        )
        iframe.contentWindow.document.close()

        setTimeout(() => {
            iframe.focus();
            iframe.contentWindow.print();
        }, 100);

    }

}
