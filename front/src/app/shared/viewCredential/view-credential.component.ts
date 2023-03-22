import { DOCUMENT } from '@angular/common';
import { Component, forwardRef, Inject, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { WINDOW } from '@delon/util';
import { BehaviorSubject, map } from 'rxjs';

@Component({
    selector: 'app-view-credential',
    templateUrl: './view-credential.component.html',
    styleUrls: ['./view-credential.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ViewCredentialComponent),
            multi: true
        }
    ]
})
export class ViewCredentialComponent implements ControlValueAccessor {
    personal: any = ''

    constructor(@Inject(DOCUMENT) private document: any,
        @Inject(WINDOW) private window: any) {
    }

    writeValue(value: any) {
        if (value !== undefined) {
            console.log(value)
            this.personal = value;
        }
    }

    registerOnChange(fn: (_: any) => void) {
        //        console.log('cambio', fn);
        //        this.propagateChange = fn;
    }

    registerOnTouched() { }

    printCard() {
        const iframe = this.document.createElement("iframe");
        iframe.style.display = 'none';
        this.document.body.appendChild(iframe);
//        iframe.contentWindow.document.write(x);
        iframe.contentWindow.document.write("HOLA" 
            
        );

        setTimeout( () => {
//            this.window.frames[0].print();
            iframe.contentWindow.print();
        }, 500);

    }

}
