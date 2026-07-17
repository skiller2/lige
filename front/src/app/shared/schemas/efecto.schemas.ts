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

// Catálogo de atributos de ingreso. A esta tabla apunta la FK de las filas de atributo del individual.
export interface AtributoIngreso {
    AtributoIngresoId: number;
    AtributoIngresoDescripcion: string;
}

export interface Rubro {
    RubroId: number;
    RubroDescripcion: string;
}

// Cada Valor pertenece a un Atributo (FK AtributoId).
export interface Valor {
    ValorId: number;
    AtributoId: number;
    ValorDescripcion: string;
}

// Fila de EfectoAtributo: el atributo/valor asignado a un efecto.
export interface EfectoAtributo {
    EfectoAtributoId: number;
    EfectoAtributoAtributoId: number | null;
    EfectoAtributoValorId: number | null;
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