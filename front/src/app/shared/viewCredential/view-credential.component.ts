import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, ElementRef, forwardRef, Inject, Input, Renderer2, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PersonaObj } from '../schemas/personal.schemas';
import { SHARED_IMPORTS } from '@shared';
import { NzQRCodeModule } from 'ng-zorro-antd/qr-code';

@Component({
    selector: 'app-view-credential',
    templateUrl: './view-credential.component.html',
    styleUrls: ['./view-credential.component.less', '../../../assets/credencial.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ViewCredentialComponent),
            multi: true
        }],
    //    encapsulation: ViewEncapsulation.ShadowDom
    imports: [ ...SHARED_IMPORTS,CommonModule,NzQRCodeModule],
    standalone:true,

})
export class ViewCredentialComponent implements ControlValueAccessor {
    personal: PersonaObj[] = [{
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
        FechaHasta: new Date(),
        Faltantes: true
    }]

    @ViewChild('cardtmpl', { static: false,read:TemplateRef }) cardtmpl!: TemplateRef<any>


    @Input('showPrintBtn') showPrintBtn: boolean = true;


    constructor(@Inject(DOCUMENT) private document: any,private renderer: Renderer2, private viewContainerRef:ViewContainerRef) { }

    writeValue(value: PersonaObj[]) {
        if (value) {
            this.personal = value;
            for (const val of value)
                val.Faltantes = (val.PersonalCUITCUILCUIT || val.image)?false:true 
        }
    }

    registerOnChange(fn: (_: any) => void) { }

    registerOnTouched() { }

    printCards(lista: any) {
        const iframe = this.renderer.createElement('iframe')
        const link = this.renderer.createElement('link')
        const div = this.renderer.createElement('div')
        this.renderer.setProperty(link, 'rel', 'stylesheet')
        this.renderer.setProperty(link, 'href', './assets/credencial.css')

        this.renderer.setStyle(iframe,'display','none')
        this.renderer.addClass(div,"card-container")
        this.renderer.addClass(div,"limit-card-columns")

        this.renderer.appendChild(document.body, iframe)
        this.renderer.appendChild(iframe.contentWindow.document.head, link)
        
        for (const personal of lista) {
            const credencialview = this.viewContainerRef.createEmbeddedView(this.cardtmpl, { ctx: personal }).rootNodes[0]
            this.renderer.addClass(credencialview,"card-inline-block")
            this.renderer.appendChild(div, credencialview)
        }

        this.renderer.appendChild(iframe.contentWindow.document.body, div)
        setTimeout(() => {
            iframe.focus();
            iframe.contentWindow.print();
            this.renderer.removeChild(document.body, iframe)
        }, 500);
    }
}
