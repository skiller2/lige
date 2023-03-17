import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { BehaviorSubject, debounceTime, delay, finalize, map, Observable } from 'rxjs'
import { ResponseByID, ResponseBySearch, Search } from 'src/app/shared/schemas/personal.schemas';
import { ResponseJSON } from 'src/app/shared/schemas/ResponseJSON';

@Injectable({
    providedIn: 'root'
})



export class SearchService {
    constructor(private http: _HttpClient) { }


    getPersonFromName(fieldName: string, values: string): Observable<Search[]> {
        if (!values || values=="") {return new BehaviorSubject<Search[]>(
            []
        ).asObservable()}
        else return this.http.post('api/personal/search', { fieldName: fieldName, value: values })
            .pipe(
                map(
                    (res: ResponseJSON<ResponseBySearch>) => {
                        if (res.msg == "ok") {
                            return res.data.recordsArray
                        }
                        else {
                            throw res.msg
                        }
                    }
                ),
            )
    }

    getInfoFromPersonalId(id: string): Observable<ResponseByID> {
        if (!id || id=="") return new BehaviorSubject<ResponseByID>({
            PersonalId: 0,
            PersonalCUITCUILCUIT: 0,
            DocumentoImagenFotoBlobNombreArchivo: "",
            image: new Blob()
        }).asObservable()
        else return this.http.get(`api/personal/${id}`)
            .pipe(
                map((res: ResponseJSON<ResponseByID>) =>  {
                    if (res.msg == "ok"){
                        return res.data
                    }
                    else {
                        throw res.msg
                    }
                })
            )
    }

    blobToBase64(blob: Blob) {
        return new Promise((resolve, _) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }


}

