export interface SearchEfecto {
    EfectoId: number,
    EfectoEfectoIndividualId: number | null,
    EfectoDescripcion: string
}

export interface ResponseBySearchEfecto {
    recordsArray: Array<SearchEfecto>
}

export interface SearchEfectoIndividual {
    EfectoEfectoIndividualId: number,
    EfectoEfectoIndividualDescripcion: string
}

export interface ResponseBySearchEfectoIndividual {
    recordsArray: Array<SearchEfectoIndividual>
}

export interface EfectoRelacionEfecto {
    EfectoRelacionEfectoId: number;
    EfectoRelacionConEfectoId: number;
    EfectoRelacionConEfectoEfectoIndividualId: number | null;
    DescripcionDe: string;
    DescripcionCon: string;
}

export interface Atributo {
    AtributoId: number;
    AtributoDescripcion: string;
}

export interface Rubro {
    RubroId: number;
    RubroDescripcion: string;
}

// La PK de Subrubro es el par (RubroId, SubrubroId): el id solo identifica dentro de su rubro.
export interface Subrubro {
    RubroId: number;
    SubrubroId: number;
    SubrubroDescripcion: string;
}

export interface EfectoIndividualAtributo {
    EfectoEfectoIndividualAtributoIngresoId: number;
    EfectoAtributoAtributoIngresoId: number;
    EfectoAtributoIngresoValor: string;
    AtributoDescripcion: string;
}