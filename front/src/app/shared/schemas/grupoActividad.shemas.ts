
export interface GrupoObj {
    
}

export interface SearchGrup {
    GrupoActividadId: number,
    GrupoActividadNumero: string,
    GrupoActividadDetalle: string
} 

export interface ResponseBySearchGrup {
    recordsArray: Array<SearchGrup>
   
}
