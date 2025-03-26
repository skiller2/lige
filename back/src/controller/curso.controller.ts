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


    async setCurso(req: any, res: Response, next: NextFunction) {

    let { 
      CursoHabilitacionCodigo, CursoHabilitacionId,CursoHabilitacionDescripcion, CursoHabilitacionCantidadHoras, 
      CursoHabilitacionVigencia, ModalidadCursoCodigo, CursoHabilitacionInstructor, 
      CentroCapacitacionId, CentroCapacitacionSedeId, CursoHabilitacionIdForEdit
     } = req.body

    console.log("req.body", req.body)
    let result = []
    const usuario = res.locals.userName;
    const ip = this.getRemoteAddress(req);

    //throw new ClientException(`test.`)
    const queryRunner = dataSource.createQueryRunner()
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      //await this.validateFormCursos(req.body)

   
      if(CursoHabilitacionIdForEdit > 0){
        // is edit

        await queryRunner.query(`
          UPDATE CursoHabilitacion SET
             CursoHabilitacionDescripcion = @0,
             CursoHabilitacionCodigo = @1,
             CursoHabilitacionCantidadHoras = @2,
             CursoHabilitacionInstructor = @3,
             CursoHabilitacionVigencia = @4,
             ModalidadCursoCodigo = @5,
             CursoHabilitacionCentroCapacitacionId = @6,
             CursoHabilitacionCentroCapacitacionSedeId = @7
          WHERE CursoHabilitacionId = @8
        `, [
             CursoHabilitacionDescripcion, 
             CursoHabilitacionCodigo,
             CursoHabilitacionCantidadHoras,
             CursoHabilitacionInstructor,
             CursoHabilitacionVigencia,
             ModalidadCursoCodigo,
             CentroCapacitacionId,
             CentroCapacitacionSedeId,
             CursoHabilitacionIdForEdit
           ]);

      }else{
        // is new
     console.log("estoy agregando")

     const existCursoHabilitacion = await queryRunner.query(`SELECT * FROM CursoHabilitacion WHERE CursoHabilitacionCodigo = @0`, [ CursoHabilitacionCodigo])

     if(existCursoHabilitacion.length > 0){
      throw new ClientException(`El código ${CursoHabilitacionCodigo} ya existe.`)
     }
     
      await queryRunner.query(`
        INSERT INTO CursoHabilitacion (
           CursoHabilitacionDescripcion,
           CursoHabilitacionInactivo,
           CursoHabilitacionCodigo,
           CursoHabilitacionDescripcion2,
           CursoHabilitacionCantidadHoras,
           CursoHabilitacionInstructor,
           CursoHabilitacionVigencia,
           ModalidadCursoCodigo,
           CursoHabilitacionCentroCapacitacionId,
           CursoHabilitacionCentroCapacitacionSedeId
        ) VALUES (
           @0, @1, @2, @3, @4, @5, @6, @7, @8, @9
        )`, [
           CursoHabilitacionDescripcion, 
           null, // CursoHabilitacionInactivo
           CursoHabilitacionCodigo,
           '-', // CursoHabilitacionDescripcion2
           CursoHabilitacionCantidadHoras,
           CursoHabilitacionInstructor,
           CursoHabilitacionVigencia,
           ModalidadCursoCodigo,
           CentroCapacitacionId,
           CentroCapacitacionSedeId
         ]);

        result = await queryRunner.query(`SELECT CursoHabilitacionId FROM CursoHabilitacion WHERE CursoHabilitacionCodigo = @0`, [ CursoHabilitacionCodigo])
        
     
      } 

      await queryRunner.commitTransaction();
      this.jsonRes({ list: result }, res, (CursoHabilitacionIdForEdit > 0) ? `se Actualizó con exito el registro` : `se Agregó con exito el registro`);
    } catch (error) {
      await queryRunner.rollbackTransaction()
      return next(error)
    } finally {
      await queryRunner.release()
    }

  }

  async validateFormCursos(req: any) {

    const { CursoHabilitacionCodigo, CursoHabilitacionId,CursoHabilitacionDescripcion, CursoHabilitacionCantidadHoras, 
      CursoHabilitacionVigencia, ModalidadCursoCodigo, CursoHabilitacionInstructor, 
      CentroCapacitacionId, CentroCapacitacionSedeId } = req

    if (!CursoHabilitacionCodigo) {
      throw new ClientException(`Debe completar el campo Código.`)
    }
    if (!CursoHabilitacionDescripcion) {
      throw new ClientException(`Debe completar el Descripcion.`)
    }
    if (!CursoHabilitacionCantidadHoras || CursoHabilitacionCantidadHoras <= 0) {
      throw new ClientException(`Debe completar el campo Cantidad de Horas y debe ser mayor a 0.`)
    }
    if (!CursoHabilitacionVigencia || CursoHabilitacionVigencia <= 0) {
      throw new ClientException(`Debe completar el campo Vigencia.`)
    }
    if (!ModalidadCursoCodigo) {
      throw new ClientException(`Debe completar el campo Modalidad.`)
    }
    if (!CursoHabilitacionInstructor) {
      throw new ClientException(`Debe completar el campo Instructor.`)
    }
    if (!CentroCapacitacionId) {
      throw new ClientException(`Debe completar el campo ID del Centro de Capacitación.`)
    }
    if (!CentroCapacitacionSedeId) {
      throw new ClientException(`Debe completar el campo ID de la Sede del Centro de Capacitación.`)
    }
  }


  
  async deleteCurso(req: any, res: Response, next: NextFunction) {
    const { CursoHabilitacionId } = req.query
    console.log("req.params", req.query)
    const queryRunner = dataSource.createQueryRunner()
   // throw new ClientException(`test`)

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      await queryRunner.query(`DELETE FROM CursoHabilitacion WHERE CursoHabilitacionId = @0 `, [CursoHabilitacionId])

      await queryRunner.commitTransaction();
      this.jsonRes({}, res, 'Borrado Exitoso')
  } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
  }

    
  }


}