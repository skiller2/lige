import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL, getOptionsSINO } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";
import { FileUploadController } from "../controller/file-upload.controller.ts";
import { PersonalController } from "../controller/personal.controller.ts"
import type { QueryRunner } from "typeorm";
import xlsx from 'node-xlsx';
import { existsSync, mkdirSync, readFileSync } from "node:fs";

const columns: any[] = [
  {
    id: 'id', name: 'id', field: 'id',
    fieldName: "obj.CustodiaCodigo",
    sortable: true,
    type: 'string',
    searchType: "string",
    searchHidden: true,
    hidden: true,
  },
  {
    id: "PersonalCUITCUILCUIT",
    field: "PersonalCUITCUILCUIT",
    name: "CUIT",
    fieldName: "cuit.PersonalCUITCUILCUIT",
    type: "string",
    sortable: true,
    searchHidden: true,
  },
  {
    id: "ApellidoNombre",
    field: "ApellidoNombre",
    name: "Apellido Nombre",
    type: "string",
    fieldName: "per.PersonalId",
    searchComponent: "inputForPersonalSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "SucursalDescripcion",
    field: "SucursalDescripcion",
    name: "Sucursal",
    type: "string",
    fieldName: "suc.SucursalId",
    searchComponent: "inputForSucursalSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "SituacionRevistaId",
    field: "SituacionRevistaId",
    name: "Situacion Revista",
    type: "number",
    fieldName: "sitrev.PersonalSituacionRevistaSituacionId",
    searchComponent: "inputForSituacionRevistaSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: true,
  },
  {
    id: "sitRevCom",
    field: "sitRevCom",
    name: "Situacion Revista",
    type: "string",
    fieldName: "sitrev.sitRevCom",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    id: "GrupoActividadDetalle",
    field: "GrupoActividadDetalle",
    name: "Grupo Actividad",
    type: "string",
    fieldName: "ga.GrupoActividadId",
    searchComponent: 'inputForGrupoActividadSearch',
    searchType: "number",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: "PersonalBancoCBU",
    field: "PersonalBancoCBU",
    name: "CBU",
    type: "string",
    fieldName: "pb.PersonalBancoCBU",
    searchType: "string",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: "BancoDescripcion",
    field: "BancoDescripcion",
    name: "Banco",
    type: "string",
    fieldName: "b.BancoDescripcion",
    searchType: "string",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: "ImporteTranferido",
    field: "ImporteTranferido",
    name: "Importe Tranferido",
    type: "currency",
    fieldName: "mo.importe",
    searchComponent: "inputForNumberAdvancedSearch",
    searchType: "numberAdvanced",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: "PersonalBancoDesde",
    field: "PersonalBancoDesde",
    name: "Desde",
    type: "date",
    fieldName: "pb.PersonalBancoDesde",
    searchComponent: "inputForFechaSearch",
    searchType: "date",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: "PersonalBancoHasta",
    field: "PersonalBancoHasta",
    name: "Hasta",
    type: "date",
    fieldName: "pb.PersonalBancoHasta",
    searchComponent: "inputForFechaSearch",
    searchType: "date",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: "IndNuevaCuenta",
    field: "IndNuevaCuenta",
    name: "Nueva Cuenta",
    type: "string",
    fieldName: "pb.IndNuevaCuenta",
    formatter: 'collectionFormatter',
    params: { collection: getOptionsSINO },
    // searchComponent: "inputForFechaSearch",
    searchType: "number",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
]

export class CuentasBancariasController extends BaseController {

  isCBU(cbu: string): boolean {
    if (!cbu || cbu.trim() == '')
      return true

    // Verifica que tenga exactamente 22 caracteres
    if (cbu.length != 22)
      return false

    // Verifica que todos los caracteres sean números
    for (let i = 0; i < cbu.length; i++) {
      const char = cbu[i];
      if (char < '0' || char > '9')
        return false
    }

    return true
  }

  async getColumnsGrid(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columns, res)
  }

  async getCuentasBancariasQuery(queryRunner: any, filterSql: any, orderBy: any) {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return await queryRunner.query(`
      SELECT CONCAT(pb.PersonalId, '-',PersonalBancoId, '-', pb.PersonalBancoCBU) id,
        pb.PersonalId, PersonalBancoId, pb.PersonalBancoBancoId, pb.PersonalBancoCBU, b.BancoDescripcion, pb.PersonalBancoDesde, pb.PersonalBancoHasta, CAST(pb.IndNuevaCuenta AS VARCHAR(1)) AS IndNuevaCuenta
        , CONCAT(TRIM(per.PersonalApellido), ', ', trim(per.PersonalNombre)) ApellidoNombre, sitrev.sitRevCom, sitrev.PersonalSituacionRevistaSituacionId
        , cuit.PersonalCUITCUILCUIT, suc.SucursalDescripcion, ga.GrupoActividadId, ga.GrupoActividadDetalle,
        mo.importe as ImporteTranferido,
		  1
      FROM PersonalBanco pb
      JOIN Banco b on b.BancoId=pb.PersonalBancoBancoId
      JOIN Personal per on per.PersonalId=pb.PersonalId
      
      LEFT JOIN (
		  SELECT mov.persona_id, mov.periodo_id, pe.anio, pe.mes, SUM(importe) importe  
		  FROM lige.dbo.liqmamovimientos mov 
		  JOIN lige.dbo.liqmaperiodo pe ON pe.periodo_id = mov.periodo_id AND pe.anio=DATEPART(YEAR, @0) AND pe.mes=DATEPART(MONTH, @0)
		  WHERE mov.tipo_movimiento_id=11 
		  GROUP BY mov.persona_id, mov.periodo_id, pe.anio, pe.mes
		  

		) mo ON mo.persona_id = per.PersonalId
      
      LEFT JOIN (
        SELECT p.PersonalId, p.PersonalSituacionRevistaSituacionId, s.SituacionRevistaDescripcion,p.PersonalSituacionRevistaDesde,
          CASE 
            WHEN p.PersonalSituacionRevistaId IS NOT NULL THEN  
              CONCAT(TRIM(s.SituacionRevistaDescripcion), ' (Desde: ', 
                FORMAT(p.PersonalSituacionRevistaDesde, 'dd/MM/yyyy'), ' - Hasta: ', 
                CASE WHEN p.PersonalSituacionRevistaHasta IS NULL THEN '' 
                    ELSE FORMAT(p.PersonalSituacionRevistaHasta, 'dd/MM/yyyy') 
                END, ')'
              )
            ELSE '' 
          END AS sitRevCom
        FROM PersonalSituacionRevista p
        JOIN SituacionRevista s
        ON p.PersonalSituacionRevistaSituacionId = s.SituacionRevistaId AND p.PersonalSituacionRevistaDesde <= @0 AND ISNULL(p.PersonalSituacionRevistaHasta,'9999-12-31') >=@0
      ) sitrev ON sitrev.PersonalId = per.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN PersonalSucursalPrincipal sucper ON sucper.PersonalId = per.PersonalId AND sucper.PersonalSucursalPrincipalId = (SELECT MAX(a.PersonalSucursalPrincipalId) PersonalSucursalPrincipalId FROM PersonalSucursalPrincipal a WHERE a.PersonalId = per.PersonalId)
      LEFT JOIN Sucursal suc ON suc.SucursalId=sucper.PersonalSucursalPrincipalSucursalId
      LEFT JOIN (
          SELECT 
            gap.GrupoActividadPersonalPersonalId,
            ga.GrupoActividadNumero, ga.GrupoActividadId,gap.GrupoActividadPersonalDesde,gap.GrupoActividadPersonalHasta,

            CASE 
                WHEN ga.GrupoActividadId IS NOT NULL THEN  
                    CONCAT(TRIM(ga.GrupoActividadDetalle), ' (Desde: ', 
                            FORMAT(gap.GrupoActividadPersonalDesde, 'dd/MM/yyyy'), ' - Hasta: ', 
                            CASE WHEN gap.GrupoActividadPersonalHasta IS NULL THEN 'Actualidad' 
                                ELSE FORMAT(gap.GrupoActividadPersonalHasta, 'dd/MM/yyyy') 
                            END, ')'
                    )
                ELSE '' 
            END AS GrupoActividadDetalle
          FROM GrupoActividadPersonal gap
          LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId = gap.GrupoActividadId
          WHERE CAST(gap.GrupoActividadPersonalDesde AS DATE) <= @0
            AND ISNULL(gap.GrupoActividadPersonalHasta,'9999-12-31') >= @0
      ) ga ON ga.GrupoActividadPersonalPersonalId= per.PersonalId

      Where ((@0 >=pb.PersonalBancoDesde and @0<= isnull(pb.PersonalBancoHasta, '9999-12-31')) or @0 <= pb.PersonalBancoDesde) 
      and (${filterSql})
      ${orderBy}
    `, [now])
  }

  async getCuentasBancarias(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
      const filterSql = filtrosToSql(options.filtros, columns);
      const orderBy = orderToSQL(options.sort)

      const lista: any[] = await this.getCuentasBancariasQuery(queryRunner, filterSql, orderBy)

      this.jsonRes(lista, res);
    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release();
    }
  }

  async handleXLSUpload(req: Request, res: Response, next: NextFunction) {
    const periodoRequest: Date = req.body.periodo ? new Date(req.body.periodo) : null
    const bancoIdRequest = Number(req.body.BancoId)
    const file = req.body.files
    const queryRunner = await getConnection(res.locals.userName);
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)
    const fechaActual: Date = new Date()
    let den_documento: string = ''
    let columnsnNotFound = []
    let dataset: any = []
    let idError: number = 0
    let altaCuentasBancarias = 0
    let docFilePath: string | null = null
    let EventoLogCodigo = 0
    let campos_vacios: any[] = [];
    
    try {
      ({ EventoLogCodigo } = await this.eventoLogInicio(
        queryRunner,
        `Importación xls Cuentas Bancarias ${bancoIdRequest}`,
        { periodo:periodoRequest, BancoId:bancoIdRequest, usuario, ip },
        usuario,
        ip,
        "JOB"
      ))

      await queryRunner.startTransaction();

      if (!periodoRequest) campos_vacios.push(`- Periodo`);
      if (!bancoIdRequest) campos_vacios.push(`- Banco`)

      if (campos_vacios.length) {
        campos_vacios.unshift('Debe completar los siguientes campos: ')
        throw new ClientException(campos_vacios)
      }

      periodoRequest.setHours(0,0,0,0)
      const anio = periodoRequest.getFullYear()
      const mes = periodoRequest.getMonth()+1
      const dia = periodoRequest.getDate()

      //Valida que el período no tenga el indicador de recibos generado
      // const checkrecibos = await this.getPeriodoQuery(queryRunner, anio, mes)
      // if (checkrecibos[0]?.ind_recibos_generados == 1)
      //   throw new ClientException(`Ya se encuentran generados los recibos para el período ${anioRequest}/${mesRequest}, no se puede hacer modificaciones`)

      const workSheetsFromBuffer = xlsx.parse(readFileSync(FileUploadController.getTempPath() + '/' + file[0].tempfilename))
      const sheet1 = workSheetsFromBuffer[0];
      const columnsName: Array<string> = sheet1.data[0]

      //Tranformo el array en un objeto con claves como los elementos del array y valores como sus índices
      const columnsXLS: any = columnsName.reduce((acc, column, index) => {
        const normalizedColumn = String(column).trim().toLowerCase()
        acc[normalizedColumn] = index;
        return acc;
      }, {} as Record<string, number>);

      sheet1.data.splice(0, 1)

      //Obtengo la descripcion del banco
      const Banco: any = await queryRunner.query(`
        SELECT BancoId, TRIM(BancoDescripcion) AS Descripcion FROM Banco WHERE BancoId IN (@0)
      `, [bancoIdRequest])
      const bancoDescripcion = Banco[0].Descripcion

      //Validar que esten las columnas nesesarias
      if (isNaN(columnsXLS['cuit'])) columnsnNotFound.push('- CUIT')
      if (isNaN(columnsXLS['cbu'])) columnsnNotFound.push('- cbu')

      if (columnsnNotFound.length) {
        columnsnNotFound.unshift('Faltan las siguientes columnas:')
        throw new ClientException(columnsnNotFound)
      }

      den_documento = `Cuentas-Bancarias-${bancoDescripcion}-${dia}-${mes}-${anio}`
      const docDescuentoObjetivo = await FileUploadController.handleDOCUpload(null, null, null, null, fechaActual, null, den_documento, anio, mes, file[0], usuario, ip, queryRunner)
      docFilePath = docDescuentoObjetivo?.newFilePath
      for (const row of sheet1.data) {
        //Finaliza cuando la fila esta vacia
        if (!row[columnsXLS['cbu']] && !row[columnsXLS['cuit']]) break
        const CBU = row[columnsXLS['cbu']]
        let CUIT = row[columnsXLS['cuit']]

        //Verifica que exista el cuit del personal
        CUIT = String(CUIT).replace(/\D/g, "")

        if (CUIT.length != 11) {
          dataset.push({ id: idError++, CUIT: row[columnsXLS['cuit']], Detalle: `El CUIT no tiene el formato correcto.` })
          continue
        }
        const PersonalCUITCUIL = await queryRunner.query(`
          SELECT cuit.PersonalId, PersonalCUITCUILCUIT
          FROM PersonalCUITCUIL cuit 
          WHERE cuit.PersonalCUITCUILCUIT IN (@0) AND PersonalCUITCUILHasta IS NULL
        `, [CUIT])
        if (!PersonalCUITCUIL.length) {
          dataset.push({ id: idError++, CUIT: row[columnsXLS['cuit']], Detalle: `No se pudo identificar el CUIT.` })
          continue
        }
        const PersonalId = CUIT[0].PersonalId

        //Verifica el formato del CBU
        if (!this.isCBU(CBU)) {
          dataset.push({ id: idError++, CUIT: row[columnsXLS['cuit']], Detalle: `El CBU debe ser de 22 digitos.` })
          continue
        }

        //Verifica si el CBU ya fue registrado
        let PersonalBanco = await queryRunner.query(`
          SELECT pb.PersonalBancoId, CONCAT(trim(per.PersonalApellido), ', ', trim(per.PersonalNombre)) ApellidoNombre, cuit.PersonalCUITCUILCUIT CUIT
          FROM PersonalBanco pb
          Left JOIN Personal per ON per.PersonalId = pb.PersonalId
          LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
          WHERE pb.PersonalBancoCBU = @0 AND  @1 <= isnull(pb.PersonalBancoHasta, '9999-12-31') and @1 >= pb.PersonalBancoDesde
        `, [CBU, fechaActual])
        if (PersonalBanco.length && CBU != '' && CBU != null){
          dataset.push({ id: idError++, CUIT: row[columnsXLS['cuit']], Detalle: `El CBU ingresado se encuentra registrado y vigente en una persona. (${PersonalBanco[0].ApellidoNombre} - CUIT: ${PersonalBanco[0].CUIT ? PersonalBanco[0].CUIT : ''})` })
          continue
        }

        PersonalBanco = await queryRunner.query(`
          SELECT PersonalBancoId, PersonalBancoDesde
          FROM PersonalBanco 
          WHERE PersonalId IN (@0) AND PersonalBancoBancoId IN (@1) AND PersonalBancoHasta IS NULL
        `, [PersonalId, bancoIdRequest])

        if (PersonalBanco.length && new Date(PersonalBanco[0].PersonalBancoDesde).getTime() == periodoRequest.getTime()) {
          const PersonalBancoId = PersonalBanco[0].PersonalBancoId
          await queryRunner.query(`
            UPDATE PersonalBanco SET
            PersonalBancoCBU = @3,
            IndNuevaCuenta = @4
            WHERE PersonalId IN (@0) AND PersonalBancoBancoId IN (@1) AND PersonalBancoId IN (@2) AND PersonalBancoHasta IS NULL
          `, [PersonalId, bancoIdRequest, PersonalBancoId, CBU, 1])
        } else {
          if (PersonalBanco.length) {
            if (PersonalBanco[0].PersonalBancoDesde.getTime() > periodoRequest.getTime()){
              dataset.push({ id: idError++, CUIT: row[columnsXLS['cuit']], Detalle: `El periodo no puede ser menor a la fecha ${PersonalBanco[0].PersonalBancoDesde.getDate()}/${PersonalBanco[0].PersonalBancoDesde.getMonth() + 1}/${PersonalBanco[0].PersonalBancoDesde.getFullYear()}` })
              continue
            }

            const PersonalBancoId = PersonalBanco[0].PersonalBancoId
            const Hasta = new Date(periodoRequest)
            Hasta.setDate(Hasta.getDate() - 1)
            await queryRunner.query(`
              UPDATE PersonalBanco SET
              PersonalBancoHasta = @3
              WHERE PersonalId IN (@0) AND PersonalBancoBancoId IN (@1) AND PersonalBancoId IN (@2)
            `, [PersonalId, bancoIdRequest, PersonalBancoId, Hasta])

          }
          const Personal = await queryRunner.query(`
            SELECT ISNULL(PersonalBancoUltNro, 0)+1 UltNro
            FROM Personal 
            WHERE PersonalId IN (@0)
          `, [PersonalId])
          const newPersonalBancoId = Personal[0].UltNro
          await queryRunner.query(`
            INSERT INTO PersonalBanco (PersonalId, PersonalBancoId, PersonalBancoBancoId, PersonalBancoCBU, PersonalBancoDesde, IndNuevaCuenta,
            AudFechaIng,AudFechaMod,AudUsuarioIng,AudUsuarioMod,AudIpIng,AudIpMod)
            VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11)

            UPDATE Personal SET PersonalBancoUltNro = @1 WHERE PersonalId IN (@0)
          `, [PersonalId, newPersonalBancoId, bancoIdRequest, CBU, periodoRequest, 1, fechaActual, fechaActual, usuario, usuario, ip, ip])
        }
        altaCuentasBancarias++
      }

      if (dataset.length > 0) {
        throw new ClientException(`Hubo ${dataset.length} errores que no permiten importar el archivo.`, { list: dataset })
      }

      await queryRunner.commitTransaction();
      await this.eventoLogFin(
        queryRunner,
        EventoLogCodigo,
        'COM',
        { res: `Procesado correctamente`, altaCuentasBancarias },
        usuario,
        ip
      );
      this.jsonRes([], res, `XLS Recibido y procesado! Se procesaron ${altaCuentasBancarias} registros correctamente`);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)

      if (docFilePath) await FileUploadController.deletePhysicalFile(docFilePath);

      await this.eventoLogFin(queryRunner,
        EventoLogCodigo,
        'ERR',
        { res: error.message || error, list: JSON.stringify(dataset) },
        usuario,
        ip
      );
      return next(error)
    } finally {
      await queryRunner.release();
    }
  }

}