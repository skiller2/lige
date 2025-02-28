import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, computed, effect, ElementRef, forwardRef, inject, Inject, Injector, Input, Renderer2, signal, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
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
        }
    ],
    //    encapsulation: ViewEncapsulation.ShadowDom
    imports: [...SHARED_IMPORTS, CommonModule, NzQRCodeModule]
})
export class ViewCredentialComponent implements ControlValueAccessor {
    personal = signal<PersonaObj[]>([]);


    @ViewChild('cardtmpl', { static: false,read:TemplateRef }) cardtmpl!: TemplateRef<any>


    @Input('showPrintBtn') showPrintBtn: boolean = true;

    imageIsLoading = signal(0)
    printDisabled = signal(false)
    renderer = inject(Renderer2)
    viewContainerRef = inject(ViewContainerRef)
    loadedImagesCount = 0
    iframe: any;
    images: any;
    injector = inject(Injector)

    ngOnInit() {
        /*
        effect(async () => {
            console.log('personal',this.personal())
        }, { injector: this.injector });
        */
    }

    writeValue(value: PersonaObj[]) {
        
        if (value) {
            this.imageIsLoading.set(value.length)
            this.personal.set(value);

            for (const val of value)
                val.Faltantes = (val.PersonalCUITCUILCUIT || val.PersonalFotoId)?false:true 
        } else { this.personal.set([]) }
        
    }

    registerOnChange(fn: (x: any) => void) { }

    registerOnTouched() { }


    onImageLoad() {
        this.loadedImagesCount++;
        if (this.loadedImagesCount === this.images.length) {
          this.onAllImagesLoaded();
        }
    }
    
    onAllImagesLoaded() {
        // Add additional logic here to handle the event
        setTimeout(() => {
            this.iframe.focus();
            this.iframe.contentWindow.print();
            this.renderer.removeChild(document.body, this.iframe)
            this.printDisabled.set(false)
        }, 500);

    }
    
    

    printCards(lista: any) {
        this.printDisabled.set(true)

        this.iframe = this.renderer.createElement('iframe')
        const link = this.renderer.createElement('link')
        const div = this.renderer.createElement('div')
        this.renderer.setProperty(link, 'rel', 'stylesheet')
        this.renderer.setProperty(link, 'href', './assets/credencial.css')

        this.renderer.setStyle(this.iframe,'display','none')
        this.renderer.addClass(div,"card-container")
        this.renderer.addClass(div,"limit-card-columns")

        this.renderer.appendChild(document.body, this.iframe)
        this.renderer.appendChild(this.iframe.contentWindow.document.head, link)
        
        for (const personal of lista) {
            const credencialview = this.viewContainerRef.createEmbeddedView(this.cardtmpl, { ctx: personal }).rootNodes[0]
            this.renderer.addClass(credencialview,"card-inline-block")
            this.renderer.appendChild(div, credencialview)
        }

        this.images = div.querySelectorAll('img')
        this.loadedImagesCount =0
        this.images.forEach((img: any) => {
            this.renderer.listen(img, 'load', () => this.onImageLoad());
        });
        



        this.renderer.appendChild(this.iframe.contentWindow.document.body, div)
        /*
        setTimeout(() => {
            this.iframe.focus();
            this.iframe.contentWindow.print();
            this.renderer.removeChild(document.body, this.iframe)
        }, 500);
        */
    }

    decImageLoading() {
        this.imageIsLoading.update(v=>v-1)
    }
}
