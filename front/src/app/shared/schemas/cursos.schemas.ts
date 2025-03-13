export interface SearchCurso {
    CursoHabilitacionDescripcion: string;
  CursoHabilitacionId: number;
  CursoHabilitacionCodigo: string;
}

export interface ResponseBySearchCurso {
  recordsArray: SearchCurso[];
} 