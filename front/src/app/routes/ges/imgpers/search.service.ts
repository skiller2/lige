import { Injectable } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { BehaviorSubject, debounceTime, delay, finalize } from 'rxjs'

export interface SearchResponse {
    msg: string,
    data: Array<any>
}

@Injectable({
    providedIn: 'root'
})



export class SearchService {
    $response: BehaviorSubject<SearchResponse> = new BehaviorSubject<SearchResponse>({ msg: "", data: []})
    $loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

    $responsePersonal: BehaviorSubject<any> = new BehaviorSubject<any>({ msg: "", data: {}})

    constructor(private http: _HttpClient) {

    }

    search(fieldName: string, values: string) {
        this.$loading.next(true)
        this.http.post('api/personal/search', { fieldName: fieldName, value: values }).pipe(
            finalize(() => {
                this.$loading.next(false)
            })
        )
            .subscribe((res) => {
                if (res){
                    // console.log(res)
                    this.$response.next(res)
                }
                else {
                    this.$response.next({msg: "", data: []})
                }
            })
    }

    getByPersonalId(id: string){
        if (id == "") return
        this.http.get(`api/personal/${id}`)
            .subscribe((res) => {
                if (res){
                    this.$responsePersonal.next(res.data)
                }
                else {
                    this.$responsePersonal.next({msg: "", data: {}})
                }
            })
    }
    

}

