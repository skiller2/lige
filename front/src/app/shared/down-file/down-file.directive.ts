import { Directive, ElementRef, EventEmitter, HostListener, Input } from '@angular/core';
import { finalize } from 'rxjs';
import { saveAs } from 'file-saver';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Directive({
    selector: '[app-down-file]', standalone:true 
})
export class AppDownFileDirective {
    @Input() httpUrl:string =""
    @Input() httpData:any =""
    @Input() httpBody: any = ""
    @Input() httpMethod: any = ""
    @Input() notificationMsg: string = ""
    @Input() fileName?: string | ((rep: HttpResponse<Blob>) => string)
    @Input() pre?: (ev: MouseEvent) => Promise<boolean>;
    @HostListener('click', ['$event']) async onClick(ev: MouseEvent){
        if (!this.isFileSaverSupported || (typeof this.pre === 'function' && !(await this.pre(ev)))) {
            ev.stopPropagation();
            ev.preventDefault();
            return;
        }
        
        if (this.notificationMsg != "")
            this.notificationService.info('',this.notificationMsg)
        this.setDisabled(true);
        this._http
            .request(this.httpMethod, this.httpUrl, {
                params: this.httpData || {},
                responseType: 'blob',
                observe: 'response',
                body: this.httpBody
            })
            .pipe(finalize(() => this.setDisabled(false)))
            .subscribe({
                next: (res) => {
                    if (res.status !== 200 || res.body!.size <= 0) {
                        this.error.emit(res);
                        return;
                    }
                    const disposition = this.getDisposition(res.headers.get('content-disposition'));
                    let fileName = this.fileName;
                    if (typeof fileName === 'function')
                        fileName = fileName(res);
                    const newfileName =
                        fileName ||
                        disposition[`filename*`] ||
                        disposition[`filename`] ||
                        res.headers.get('filename') ||
                        res.headers.get('x-filename')
                    
                    saveAs(res.body!, decodeURI(String(newfileName).replace(/['"]+/g, '')));
                    this.success.emit(res);
                },
                error: err => this.error.emit(err)
            });

    } 
        
    isFileSaverSupported: boolean

    readonly success: EventEmitter<HttpResponse<Blob>>;
    readonly error: EventEmitter<any>;
    
    constructor(public el: ElementRef, public _http: HttpClient, public notificationService: NzNotificationService) {
        this.isFileSaverSupported = true;
        this.httpMethod = 'get';
        this.success = new EventEmitter();
        this.error = new EventEmitter();
        let isFileSaverSupported = false;
        try {
            isFileSaverSupported = !!new Blob();
        }
        catch { }
        this.isFileSaverSupported = isFileSaverSupported;
        if (!isFileSaverSupported) {
            el.nativeElement.classList.add(`down-file__not-support`);
        }
    }

    setDisabled(status: boolean) {
        const el = this.el.nativeElement;
        el.disabled = status;
        el.classList[status ? 'add' : 'remove'](`down-file__disabled`);
    }

    getDisposition(data: string | null) {
        const arr = (data || '')
            .split(';')
            .filter(i => i.includes('='))
            .map(v => {
                const strArr = v.split('=');
                const utfId = `UTF-8''`;
                let value = strArr[1];
                if (value.startsWith(utfId))
                    value = value.substring(utfId.length);
                return { [strArr[0].trim()]: value };
            });
        return (arr.reduce((_o, item) => item, {}));
    }

}
