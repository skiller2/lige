import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { QueryRunner } from "typeorm";


const columnsCursos:any[] = [
  {
    id:'id', name:'Id', field:'id',
    fieldName: "",
    type:'number',
    searchType: "number",
    sortable: true,
    hidden: true,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id: 'Codigo', name: 'Codigo', field: 'CursoHabilitacionCodigo',
    fieldName: 'cur.CursoHabilitacionCodigo',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'Descripcion', name: 'Descripción', field: 'CursoHabilitacionDescripcion',
    fieldName: 'cur.CursoHabilitacionDescripcion',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    name: "Curso ",
    type: "string",
    id: "CursoHabilitacionId",
    field: "CursoHabilitacionId",
    fieldName: "cur.CursoHabilitacionId",
    searchComponent: "inpurForCursoSearch",
    sortable: true,
    searchHidden: false,
    hidden: true, 
  },
  {
    id: 'CantidadHoras', 
    name: 'Cantidad Horas', 
    field: 'CursoHabilitacionCantidadHoras',
    fieldName: 'cur.CursoHabilitacionCantidadHoras',
    type: 'varchar',
    searchType: 'varchar',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'VigenciaD', 
    name: 'Vigencia (D)', 
    field: 'CursoHabilitacionVigencia',
    fieldName: 'cur.CursoHabilitacionVigencia',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'Modalidad', 
    name: 'Modalidad', 
    field: 'ModalidadCursoModalidad',
    fieldName: 'modcur.ModalidadCursoModalidad',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    name: "Modalidad",
    type: "string",
    id: "ModalidadCursoCodigo",
    field: "ModalidadCursoCodigo",
    fieldName: "modcur.ModalidadCursoCodigo",
    searchComponent: "inpurForModalidadCursoSearch",
    sortable: true,
    searchHidden: false,
    hidden: true,  
  },
]

const columnsCursosHistory:any[] = [
  {
    id:'id', name:'Id', field:'id',
    fieldName: "",
    type:'number',
    searchType: "number",
    sortable: true,
    hidden: true,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id: 'Codigo', name: 'Codigo', field: 'CursoHabilitacionCodigo',
    fieldName: 'cur.CursoHabilitacionCodigo',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'Descripcion', name: 'Descripción', field: 'CursoHabilitacionDescripcion',
    fieldName: 'cur.CursoHabilitacionDescripcion',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'CantidadHoras', 
    name: 'Cantidad Horas', 
    field: 'CursoHabilitacionCantidadHoras',
    fieldName: 'cur.CursoHabilitacionCantidadHoras',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'VigenciaD', 
    name: 'Vigencia (D)', 
    field: 'CursoHabilitacionVigencia',
    fieldName: 'cur.CursoHabilitacionVigencia',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'Modalidad', 
    name: 'Modalidad', 
    field: 'ModalidadCursoModalidad',
    fieldName: 'modcur.ModalidadCursoModalidad',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'CentroCapacitacionRazonSocial', 
    name: 'Centro de Capacitación', 
    field: 'CentroCapacitacionRazonSocial',
    fieldName: 'cencap.CentroCapacitacionRazonSocial',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'CentroCapacitacionSedeDescripcion', 
    name: 'Sede de Capacitación', 
    field: 'CentroCapacitacionSedeDescripcion',
    fieldName: 'sede.CentroCapacitacionSedeDescripcion',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'CursoHabilitacionInstructor', 
    name: 'Instructor', 
    field: 'CursoHabilitacionInstructor',
    fieldName: 'cur.CursoHabilitacionInstructor',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },

]


export class CursoController extends BaseController {

  search(req: any, res: Response, next: NextFunction) {
    const { fieldName, value } = req.body

    let buscar = false;
    let query: string = `SELECT CursoHabilitacionId,CursoHabilitacionDescripcion,CursoHabilitacionCodigo FROM CursoHabilitacion ch
    WHERE`;
    switch (fieldName) {
      case "CursoHabilitacionDescripcion":
        const valueArray: Array<string> = value.split(/[\s,.]+/);
        valueArray.forEach((element, index) => {
          if (element.trim().length > 1) {
            query += `(ch.CursoHabilitacionDescripcion LIKE '%${element.trim()}%' OR ch.CursoHabilitacionCodigo LIKE '%${element.trim()}%') AND  `;
            buscar = true;
          }
        });
        break;
      case "CursoHabilitacionId":
        if (value > 0) {
          query += ` ch.CursoHabilitacionId = '${value}' AND `;
          buscar = true;
        }
        break;
      default:
        break;
    }

    if (buscar == false) {
      this.jsonRes({ recordsArray: [] }, res);
      return;
    }

    dataSource
      .query((query += " 1=1"))
      .then((records) => {
        this.jsonRes({ recordsArray: records }, res);
      })
      .catch((error) => {
        return next(error)
      });
  }


  async getCursosColumns(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columnsCursos, res)
  }

  async getCursosColumnsHistory(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columnsCursosHistory, res)
  }

  async list(req: any, res: Response, next: NextFunction) {


    //const filterSql = filtrosToSql(req.body.filters["options"].filtros, listaColumnas)

    const filterSql = filtrosToSql(req.body.options.filtros, columnsCursos);
    const orderBy = orderToSQL(req.body.options.sort)

    //const orderBy = orderToSQL(req.body.options.sort)
    const queryRunner = dataSource.createQueryRunner();
    const fechaActual = new Date()
    const anio = fechaActual.getFullYear()
    const mes = fechaActual.getMonth() + 1

    try {
      const cursos = await queryRunner.query(
        `SELECT 
        ROW_NUMBER() OVER (ORDER BY cur.CursoHabilitacionId) as id
        ,cur.CursoHabilitacionId
        , cur.CursoHabilitacionDescripcion
        ,cur.CursoHabilitacionCodigo
        , cur.CursoHabilitacionCantidadHoras
        , cur.CursoHabilitacionInstructor
        , cur.CursoHabilitacionVigencia
        ,cencap.CentroCapacitacionRazonSocial
        ,sede.CentroCapacitacionSedeDescripcion

        ,modcur.ModalidadCursoCodigo
        ,modcur.ModalidadCursoModalidad

        ,cencap.CentroCapacitacionId
        ,cencap.CentroCapacitacionRazonSocial

        ,sede.CentroCapacitacionSedeId
        ,sede.CentroCapacitacionSedeDescripcion

        FROM CursoHabilitacion cur

        LEFT JOIN ModalidadCurso modcur ON modcur.ModalidadCursoCodigo=cur.ModalidadCursoCodigo
        LEFT JOIN CentroCapacitacionSede sede ON sede.CentroCapacitacionId=cur.CursoHabilitacionCentroCapacitacionId AND sede.CentroCapacitacionSedeId=cur.CursoHabilitacionCentroCapacitacionSedeId

        LEFT JOIN CentroCapacitacion cencap ON cencap.CentroCapacitacionId=sede.CentroCapacitacionId
        WHERE ${filterSql} ${orderBy}`
      )

      this.jsonRes(
        {
          total: cursos.length,
          list: cursos,
        },
        res
      );

    } catch (error) {
      return next(error)
    }

  }

  async listHistory(req: any, res: Response, next: NextFunction) {

    const { CursoHabilitacionId, CentroCapacitacionSedeId } = req.body

    const queryRunner = dataSource.createQueryRunner();

    try {
      const cursos = await queryRunner.query(
        `SELECT 
           ROW_NUMBER() OVER (ORDER BY cur.CursoHabilitacionId) as id
        ,cur.CursoHabilitacionId
        , cur.CursoHabilitacionDescripcion
        ,cur.CursoHabilitacionCodigo
        , cur.CursoHabilitacionCantidadHoras
        , cur.CursoHabilitacionInstructor
        , cur.CursoHabilitacionVigencia
        ,cencap.CentroCapacitacionRazonSocial
        ,sede.CentroCapacitacionSedeDescripcion

        ,modcur.ModalidadCursoCodigo
        ,modcur.ModalidadCursoModalidad

        ,cencap.CentroCapacitacionId


        ,sede.CentroCapacitacionSedeId


        FROM CursoHabilitacion cur

        LEFT JOIN ModalidadCurso modcur ON modcur.ModalidadCursoCodigo=cur.ModalidadCursoCodigo
        LEFT JOIN CentroCapacitacionSede sede ON sede.CentroCapacitacionId=cur.CursoHabilitacionCentroCapacitacionId AND sede.CentroCapacitacionSedeId=cur.CursoHabilitacionCentroCapacitacionSedeId

        LEFT JOIN CentroCapacitacion cencap ON cencap.CentroCapacitacionId=sede.CentroCapacitacionId
    WHERE cur.CursoHabilitacionId = ${CursoHabilitacionId} 

    `
      )

      //    ${CentroCapacitacionSedeId ? `AND sede.CentroCapacitacionSedeId = ${CentroCapacitacionSedeId}` : ''}

      this.jsonRes(
        {
          total: cursos.length,
          list: cursos,
        },
        res
      );

    } catch (error) {
      return next(error)
    }

  }

  searchModalidadCurso(req: any, res: Response, next: NextFunction) {
      const { fieldName, value, CentroCapacitacionId } = req.body
      console.log("---------------CentroCapacitacionId------------------",CentroCapacitacionId)
      let buscar = false;
      let query: string = `SELECT * FROM ModalidadCurso modcur
      WHERE`;
      switch (fieldName) {
        case "ModalidadCursoModalidad":
          const valueArray: Array<string> = value.split(/[\s,.]+/);
          valueArray.forEach((element, index) => {
            if (element.trim().length > 1) {
              query += `(modcur.ModalidadCursoModalidad LIKE '%${element.trim()}%') AND  `;
              buscar = true;
            }
          });
          break;
        case "ModalidadCursoCodigo":
          if (value > 0) {
            query += ` modcur.ModalidadCursoCodigo = '${value}' AND `;
            buscar = true;
          }
          break;
        default:
          break;
      }
  
      if (buscar == false) {
        this.jsonRes({ recordsArray: [] }, res);
        return;
      }
  
      dataSource
        .query((query += " 1=1"))
        .then((records) => {
          this.jsonRes({ recordsArray: records }, res);
        })
        .catch((error) => {
          return next(error)
        });
    }
  

}