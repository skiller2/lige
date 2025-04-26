import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { QueryRunner } from "typeorm";
import { FileUploadController } from "../controller/file-upload.controller"


const listaColumnas: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    name: "CUIT",
    type: "string",
    id: "PersonalCUITCUILCUIT",
    field: "PersonalCUITCUILCUIT",
    fieldName: "cuit.PersonalCUITCUILCUIT",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    name: "Apellido Nombre",
    type: "string",
    id: "ApellidoNombre",
    field: "ApellidoNombre",
    fieldName: "CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre))",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    name: "Apellido Nombre ",
    type: "number",
    id: "PersonalId",
    field: "PersonalId",
    fieldName: "perest.PersonalId",
    searchComponent: "inpurForPersonalSearch",
    sortable: true,
    searchHidden: false,
    hidden: true,
  },
  {
    name: "Tipo",
    type: "string",
    id: "TipoEstudioDescripcion",
    field: "TipoEstudioDescripcion",
    fieldName: "tipest.TipoEstudioDescripcion",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    name: "Tipo De Estudio",
    type: "number",
    id: "TipoEstudioId",
    field: "TipoEstudioId",
    fieldName: "perest.TipoEstudioId",
    searchComponent: "inpurForNivelEstudioSearch",
    sortable: true,
    searchHidden: false,
    hidden: true,
  },
  {
    name: "Título",
    type: "string",
    id: "PersonalEstudioTitulo",
    field: "PersonalEstudioTitulo",
    fieldName: "perest.PersonalEstudioTitulo",
    sortable: true,
    hidden: false,
    searchHidden: true
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
    name: "Fecha Otorgado",
    type: "date",
    id: "PersonalEstudioOtorgado",
    field: "PersonalEstudioOtorgado",
    fieldName: "perest.PersonalEstudioOtorgado",
    searchComponent: "inpurForFechaSearch",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    name: "Hasta",
    type: "date",
    id: "PersonalEstudioHasta",
    field: "PersonalEstudioHasta",
    fieldName: "perest.PersonalEstudioHasta",
    searchComponent: "inpurForFechaSearch",
    sortable: true,
    searchHidden: false,
    hidden: false,
  }
];

export class EstudioController extends BaseController {
  private async geEstadosEstudioQuery(queryRunner: any) {
    return await queryRunner.query(`
            SELECT est.EstadoEstudioId value, TRIM(est.EstadoEstudioDescripcion) label
            FROM EstadoEstudio est`)
  }

  async geEstadosEstudio(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await this.geEstadosEstudioQuery(queryRunner)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  private async getTiposEstudioQuery(queryRunner: any) {
    return await queryRunner.query(`
            SELECT tipo.TipoEstudioId value, TRIM(tipo.TipoEstudioDescripcion) label
            FROM TipoEstudio tipo`)
  }

  async getTiposEstudio(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await this.getTiposEstudioQuery(queryRunner)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }


  async getGridCols(req, res) {
    this.jsonRes(listaColumnas, res);
  }


  async list(req: any, res: Response, next: NextFunction) {


    //const filterSql = filtrosToSql(req.body.filters["options"].filtros, listaColumnas)

    const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)

    //const orderBy = orderToSQL(req.body.options.sort)
    const queryRunner = dataSource.createQueryRunner();
    const fechaActual = new Date()
    const anio = fechaActual.getFullYear()
    const mes = fechaActual.getMonth() + 1

    try {
      const objetivos = await queryRunner.query(
        `SELECT 
          ROW_NUMBER() OVER (ORDER BY perest.PersonalEstudioId) as id,
          CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
          ,cuit.PersonalCUITCUILCUIT
          ,perest.PersonalEstudioId
          ,perest.PersonalId
          ,perest.TipoEstudioId
          ,TRIM(perest.PersonalEstudioTitulo) as PersonalEstudioTitulo
          ,perest.PersonalEstudioOtorgado
          ,perest.PersonalEstudioHasta
          ,tipest.TipoEstudioDescripcion
          ,cur.CursoHabilitacionDescripcion
          ,cur.CursoHabilitacionId

        FROM PersonalEstudio perest

        LEFT JOIN TipoEstudio tipest ON tipest.TipoEstudioId=perest.TipoEstudioId
        LEFT JOIN Personal per ON per.PersonalId=perest.PersonalId
        LEFT JOIN CursoHabilitacion cur ON cur.CursoHabilitacionId=perest.PersonalEstudioCursoId
        LEFT JOIN ModalidadCurso modcur ON modcur.ModalidadCursoCodigo=cur.ModalidadCursoCodigo

        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId 
                AND cuit.PersonalCUITCUILId = (
                    SELECT MAX(cuitmax.PersonalCUITCUILId) 
                    FROM PersonalCUITCUIL cuitmax 
                    WHERE cuitmax.PersonalId = per.PersonalId
                )
        WHERE ${filterSql} ${orderBy}`
      )

      this.jsonRes(
        {
          total: objetivos.length,
          list: objetivos,
        },
        res
      );

    } catch (error) {
      return next(error)
    }

  }

  async search(req: any, res: Response, next: NextFunction) {

    const queryRunner = dataSource.createQueryRunner();
    try {
      const TipoEstudio = await queryRunner.query(`SELECT TipoEstudioId, TipoEstudioDescripcion FROM TipoEstudio `)

      return this.jsonRes(TipoEstudio, res);
    } catch (error) {
      return next(error)
    } finally {

    }


  }

  async searchId(req: any, res: Response, next: NextFunction) {

    const { id } = req.params
    const queryRunner = dataSource.createQueryRunner();
    try {
      const CursoHabilitacion = await queryRunner.query(`SELECT TipoEstudioId, TipoEstudioDescripcion FROM TipoEstudio Where TipoEstudioId = ${id}`)

      return this.jsonRes(CursoHabilitacion, res);
    } catch (error) {
      return next(error)
    } finally {

    }


  }



  async setEstudio(req: any, res: Response, next: NextFunction) {
    let {
      PersonalId,
      TipoEstudioId, // Primario secundario, terciario, universitario, curso
      CursoHabilitacionId, // tipo de curso
      PersonalEstudioTitulo, //titulo otorgado
      PersonalEstudioOtorgado, // fecha desde
      PersonalIdForEdit,
      PersonalEstudioId,
      PersonalEstudioPagina1Id // Para el archivo 
    } = req.body

    let result = []

    console.log("req.body", req.body)

    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)

    //throw new ClientException(`test.`)
    const queryRunner = dataSource.createQueryRunner()
    await queryRunner.connect();
    await queryRunner.startTransaction();
    

    try {

      await this.validateFormObjetivos(req.body)

      if (!PersonalEstudioTitulo && CursoHabilitacionId) {
        const CursoHabilitacionQuery = await queryRunner.query(` SELECT CursoHabilitacionDescripcion FROM CursoHabilitacion WHERE CursoHabilitacionId = @0`,[CursoHabilitacionId])
        PersonalEstudioTitulo = CursoHabilitacionQuery[0].CursoHabilitacionDescripcion
      }
      
      
      const EstadoEstudioId = 2
      let PersonalEstudioHasta = null
      PersonalEstudioOtorgado = new Date(new Date(PersonalEstudioOtorgado).setHours(0, 0, 0, 0))

      // Calculo de fecha hasta para curso de habilitacion
      if (TipoEstudioId == 8) {

        const CursoHabilitacionQuery = await queryRunner.query(`
          SELECT CursoHabilitacionVigencia FROM CursoHabilitacion
          WHERE CursoHabilitacionId = ${CursoHabilitacionId}
        `)
        const CursoHabilitacionVigencia = CursoHabilitacionQuery[0].CursoHabilitacionVigencia

        if (CursoHabilitacionVigencia) {
          let fechaTemp = new Date(new Date(PersonalEstudioOtorgado).getTime() + (CursoHabilitacionVigencia * 24 * 60 * 60 * 1000))
          PersonalEstudioHasta = new Date(fechaTemp.getFullYear(), fechaTemp.getMonth(), fechaTemp.getDate(), 0, 0, 0, 0)
        }

      }
      let PersonalEstudioCursoId = CursoHabilitacionId == '' ? null : CursoHabilitacionId
      if (PersonalIdForEdit > 0) {
        // is edit
        await queryRunner.query(`
          UPDATE PersonalEstudio SET
            TipoEstudioId = @2,
            PersonalEstudioTitulo = @3,
            PersonalEstudioCursoId = @4,
            PersonalEstudioOtorgado = @5,
            PersonalEstudioHasta = @6
          WHERE PersonalId = @0 AND PersonalEstudioId = @1
          `, [
          PersonalId,
          PersonalEstudioId,
          TipoEstudioId,
          PersonalEstudioTitulo,
          PersonalEstudioCursoId,
          PersonalEstudioOtorgado,
          PersonalEstudioHasta]);

      } else {
        // is new

        PersonalEstudioId = await queryRunner.query(`SELECT MAX(pe.PersonalEstudioId) as PersonalEstudioId FROM  PersonalEstudio pe WHERE PersonalId = @0`, [PersonalId])

        if (PersonalEstudioId[0].PersonalEstudioId)
          PersonalEstudioId = PersonalEstudioId[0].PersonalEstudioId + 1
        else
          PersonalEstudioId = 1


        await queryRunner.query(`
        INSERT INTO PersonalEstudio (
          PersonalId,
          PersonalEstudioId,
          TipoEstudioId,
          EstadoEstudioId,
          PersonalEstudioTitulo,
          PersonalEstudioCursoId,
          PersonalEstudioOtorgado,
          PersonalEstudioHasta
        ) VALUES (
        @0,@1, @2,@3,@4, @5, @6,@7
        )`, [
          PersonalId,
          PersonalEstudioId,
          TipoEstudioId,
          EstadoEstudioId,
          PersonalEstudioTitulo,
          PersonalEstudioCursoId,
          PersonalEstudioOtorgado,
          PersonalEstudioHasta]);

      }

      console.log("req.body.files", req.body.files)

      if (req.body.files?.length > 0) {
        // hacer for para cada archivo
        for (const file of req.body.files) {

          let fec_doc_ven = file.fec_doc_ven ? file.fec_doc_ven : PersonalEstudioHasta
     
          await FileUploadController.handleDOCUpload(
            PersonalId, 
            file.objetivo_id, 
            file.cliente_id, 
            file.id, 
            new Date(), 
            fec_doc_ven, 
            file.den_documento, 
            file, 
            usuario,
            ip,
            queryRunner)

          const maxId = await queryRunner.query(`SELECT MAX(doc_id) AS doc_id FROM lige.dbo.docgeneral`)
          let PersonalEstudioPagina1Id = maxId[0].doc_id 
  
          await queryRunner.query(`UPDATE PersonalEstudio SET PersonalEstudioPagina1Id = @0 WHERE PersonalId = @1 AND PersonalEstudioId = @2`,
             [PersonalEstudioPagina1Id, PersonalId, PersonalEstudioId])
          }
        
      }

      result = await queryRunner.query(`SELECT PersonalId,PersonalEstudioId,TipoEstudioId,EstadoEstudioId,PersonalEstudioPagina1Id FROM PersonalEstudio
        WHERE PersonalId = @0 AND PersonalEstudioId = @1`, [PersonalId, PersonalEstudioId])

      await queryRunner.commitTransaction();
      this.jsonRes({ list: result[0] }, res, (PersonalIdForEdit > 0) ? `se Actualizó con exito el registro` : `se Agregó con exito el registro`);
    } catch (error) {
      await queryRunner.rollbackTransaction()
      return next(error)
    } finally {
      await queryRunner.release()
    }

  }

  async validateFormObjetivos(params: any) {

    if (!params.PersonalId) {
      throw new ClientException(`Debe completar el campo Persona.`)
    }
    if (!params.TipoEstudioId) {
      throw new ClientException(`Debe completar el campo Nivel de Estudio.`)
    }
    if (!params.PersonalEstudioOtorgado) {
      throw new ClientException(`Debe completar el campo Fecha Otorgado.`)
    }


    if (params.TipoEstudioId == 8) {
      if (!params.CursoHabilitacionId) {
        throw new ClientException(`Debe completar el campo Curso.`)
      }
    } else {
      if (!params.PersonalEstudioTitulo) {
        throw new ClientException(`Debe completar el campo Título del Certificado.`)
      }
    }

    if(params.files.length == 0){
      throw new ClientException(`Debe subir al menos un archivo.`)
    }

    if(params.files.length > 1){
      throw new ClientException(`Debe subir un solo archivo.`)
    }
  }

  async getEstudio(req: any, res: Response, next: NextFunction) {

    const { PersonalId, PersonalEstudioId } = req.params
    const queryRunner = dataSource.createQueryRunner()

    try {

      let result = await queryRunner.query(`
        SELECT PersonalId,PersonalEstudioId,TipoEstudioId,PersonalEstudioTitulo,PersonalEstudioCursoId,PersonalEstudioOtorgado,PersonalEstudioPagina1Id FROM PersonalEstudio
        WHERE PersonalId = @0 AND PersonalEstudioId = @1
      `, [PersonalId, PersonalEstudioId])
      this.jsonRes(result[0], res);
    } catch (error) {
      return next(error)
    }

  }

  async deleteEstudio(req: any, res: Response, next: NextFunction) {
    const { PersonalId, PersonalEstudioId } = req.body
    const queryRunner = dataSource.createQueryRunner()

    console.log('req.body', req.body)
    //throw new ClientException(`test.`)

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const PersonalEstudioPagina1Id = await queryRunner.query(`SELECT PersonalEstudioPagina1Id FROM PersonalEstudio WHERE PersonalEstudioId = @0 AND PersonalId = @1`, [PersonalEstudioId, PersonalId])
      
      await queryRunner.query(`DELETE FROM PersonalEstudio  WHERE PersonalId = @0 AND PersonalEstudioId = @1`, [PersonalId, PersonalEstudioId])

      if(PersonalEstudioPagina1Id[0].PersonalEstudioPagina1Id) {
        await FileUploadController.deleteFile(PersonalEstudioPagina1Id[0].PersonalEstudioPagina1Id, 'docgeneral', queryRunner)
      }
      
      await queryRunner.commitTransaction();
      this.jsonRes({}, res, 'Borrado Exitoso')
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } 

  }

}