
export interface GrupoObj {
    
}

export interface SearchGrup {
    GrupoActividadId: number,
    Detalle: string
    fullaname: string
}

export interface ResponseBySearchGrup {
    recordsArray: Array<SearchGrup>
   
}
