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
      return false

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

  async getCuentasBancariasQuery(queryRunner: any, filterSql: any, orderBy: any, periodo: Date, sitRevistaPeriodo: Date, liqmaperiodo: Date) {
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
        JOIN lige.dbo.liqmaperiodo pe ON pe.periodo_id = mov.periodo_id AND pe.anio=DATEPART(YEAR, @2) AND pe.mes=DATEPART(MONTH, @2)
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
        ON p.PersonalSituacionRevistaSituacionId = s.SituacionRevistaId AND p.PersonalSituacionRevistaDesde <= @1 AND ISNULL(p.PersonalSituacionRevistaHasta,'9999-12-31') >= @1
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
      ) ga ON ga.GrupoActividadPersonalPersonalId = per.PersonalId

      WHERE ((@0 >= pb.PersonalBancoDesde AND @0 <= ISNULL(pb.PersonalBancoHasta, '9999-12-31')) OR @0 <= pb.PersonalBancoDesde) 
      AND (${filterSql})
      ${orderBy}
    `, [periodo, sitRevistaPeriodo, liqmaperiodo])
  }

  async getCuentasBancarias(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
      const filterSql = filtrosToSql(options.filtros, columns);
      const orderBy = orderToSQL(options.sort)
      const periodo = new Date(req.body.periodo)
      const sitRevistaPeriodo = new Date(req.body.sitRevistaPeriodo)
      const liqmaperiodo = new Date(req.body.liqmaperiodo)

      const lista: any[] = await this.getCuentasBancariasQuery(queryRunner, filterSql, orderBy, periodo, sitRevistaPeriodo, liqmaperiodo)

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
    const file = req.body.file
    //La importación completa el CBU de las cuentas nuevas, por lo que dejan de estar pendientes
    const IndNuevaCuenta = 0
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
        { periodo: periodoRequest, BancoId: bancoIdRequest, usuario, ip },
        usuario,
        ip,
        "LIQ"
      ))

      await queryRunner.startTransaction();

      if (!periodoRequest) campos_vacios.push(`- Periodo`);
      if (!bancoIdRequest) campos_vacios.push(`- Banco`)

      if (campos_vacios.length) {
        campos_vacios.unshift('Debe completar los siguientes campos: ')
        throw new ClientException(campos_vacios)
      }

      periodoRequest.setHours(0, 0, 0, 0)
      const anio = periodoRequest.getFullYear()
      const mes = periodoRequest.getMonth() + 1
      const dia = periodoRequest.getDate()

      //Valida que el período no tenga el indicador de recibos generado
      // const checkrecibos = await this.getPeriodoQuery(queryRunner, anio, mes)
      // if (checkrecibos[0]?.ind_recibos_generados == 1)
      //   throw new ClientException(`Ya se encuentran generados los recibos para el período ${anioRequest}/${mesRequest}, no se puede hacer modificaciones`)

      const workSheetsFromBuffer = xlsx.parse(readFileSync(FileUploadController.getTempPath() + '/' + file[0].tempfilename))
      const sheet1 = workSheetsFromBuffer[0];

      // Índices de columnas del Excel. El encabezado, los nombres de columna y el
      // formato del CBU varían por banco, por eso se resuelven dentro del switch.
      let idxCuit: number
      let idxCbu: number

      switch (bancoIdRequest) {
        case 4: { //Banco Patagonia
          //El encabezado está en la fila 7 (índice 6)
          const columnsName: Array<string> = sheet1.data[6]
          const columnsXLS: Record<string, number> = columnsName.reduce((acc, column, index) => {
            acc[String(column).trim().toLowerCase()] = index
            return acc
          }, {} as Record<string, number>)

          idxCuit = columnsXLS['cuit / cuil / cdi nro']
          idxCbu = columnsXLS['cbu']

          //Valida que estén las columnas necesarias
          if (isNaN(idxCuit)) columnsnNotFound.push('- CUIT')
          if (isNaN(idxCbu)) columnsnNotFound.push('- CBU')
          if (columnsnNotFound.length) {
            columnsnNotFound.unshift('Faltan las siguientes columnas:')
            throw new ClientException(columnsnNotFound)
          }

          //Elimino las primeras 7 filas (índices 0 a 6) para dejar los datos desde la fila 8
          sheet1.data.splice(0, 7)

          //Patagonia exporta el CBU con formato "General" y pierde el 0 inicial (queda en 21 dígitos).
          //Relleno con ceros a la izquierda para reconstruir los 22 dígitos.
          for (const row of sheet1.data) {
            if (row[idxCbu] != null && String(row[idxCbu]).trim() !== '')
              row[idxCbu] = String(row[idxCbu]).trim().padStart(22, '0')
          }
          break
        }
        default:
          throw new ClientException(`No se encuentra configurado el banco con id ${bancoIdRequest} para la importación de cuentas bancarias.`)
      }

      den_documento = `Alta-Cuentas-Bancarias-${bancoIdRequest}-${dia}-${mes}-${anio}`
      const docDescuentoObjetivo = await FileUploadController.handleDOCUpload(null, null, null, null, fechaActual, null, den_documento, anio, mes, file[0], usuario, ip, queryRunner)
      docFilePath = docDescuentoObjetivo?.newFilePath

      //CBU que trae cada CUIT en el Excel (CUIT normalizado a 11 dígitos)
      const cbuPorCuitExcel = new Map<string, string>()
      for (const row of sheet1.data) {
        const cuit = String(row[idxCuit] ?? '').replace(/\D/g, "")
        if (cuit.length !== 11) continue
        cbuPorCuitExcel.set(cuit, String(row[idxCbu] ?? '').trim())
      }

      //Personas con cuenta nueva (IndNuevaCuenta = 1) vigente para este banco: son las únicas actualizables
      const cuentasNuevas: any[] = await queryRunner.query(`
        SELECT pb.PersonalId, cuit.PersonalCUITCUILCUIT
        FROM PersonalBanco pb
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = pb.PersonalId AND cuit.PersonalCUITCUILId = (SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = pb.PersonalId)
        WHERE pb.IndNuevaCuenta = 1 AND pb.PersonalBancoBancoId = @0 AND pb.PersonalBancoHasta IS NULL
      `, [bancoIdRequest])

      //Cruce: de las cuentas nuevas me quedo sólo con las que vienen en el Excel, cada una con su CBU.
      //Los CUIT del Excel que no existen o que no tienen cuenta nueva quedan fuera (se saltean).
      const cuentasAActualizar = cuentasNuevas.map((r: any) => {
        const CUIT = String(r.PersonalCUITCUILCUIT ?? '').replace(/\D/g, "")
        return { PersonalId: r.PersonalId, CUIT, CBU: cbuPorCuitExcel.get(CUIT) }
      }).filter((item) => item.CBU !== undefined)

      for (const { PersonalId, CUIT, CBU } of cuentasAActualizar) {
        //CBU vacío en una cuenta a actualizar
        if (!CBU) {
          dataset.push({ id: idError++, CUIT, Detalle: `El CBU está vacío.` })
          continue
        }

        //Formato de CBU (22 dígitos numéricos)
        if (!this.isCBU(CBU)) {
          dataset.push({ id: idError++, CUIT, Detalle: `El CBU debe ser de 22 dígitos. (${CBU})` })
          continue
        }

        try {
          await PersonalController.setPersonalBancoQuerys(queryRunner, PersonalId, bancoIdRequest, periodoRequest, CBU, IndNuevaCuenta, fechaActual, usuario, ip)
          altaCuentasBancarias++
        } catch (error: any) {
          const detalle = error instanceof ClientException ? error.messageArr.join(' - ') : (error?.message ?? String(error))
          dataset.push({ id: idError++, CUIT, Detalle: detalle })
          continue
        }
      }

      if (dataset.length > 0) {
        throw new ClientException(`Hubo ${dataset.length} errores que no permiten importar el archivo.`, { list: dataset })
      }

      await queryRunner.commitTransaction();

      const successMessage = `XLS Recibido y procesado! Registros procesados correctamente: ${altaCuentasBancarias}`;

      await this.eventoLogFin(
        queryRunner,
        EventoLogCodigo,
        'COM',
        { res: successMessage, 'Alta': altaCuentasBancarias },
        usuario,
        ip
      );
      this.jsonRes([], res, successMessage);
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

  async addCuentasBancarias(req: any, res: Response, next: NextFunction) {
    const fechaActual = new Date()
    const ip = this.getRemoteAddress(req)
    const usuario = res.locals.userName
    const queryRunner = await getConnection(usuario);
    const CUITs: string = req.body.CUITs
    const BancoId: number = req.body.BancoId
    let Desde = req.body.Desde
    const IndNuevaCuenta: number = 1
    let errors: any[] = []

    try {
      let campos_vacios: any[] = []
      await queryRunner.startTransaction()

      if (!BancoId) campos_vacios.push(`- Banco`);
      if (!Desde) campos_vacios.push(`- Desde`);
      if (!(CUITs?.length)) campos_vacios.push(`- CBUs`);
      if (campos_vacios.length) {
        campos_vacios.unshift('Debe completar los siguientes campos:')
        throw new ClientException(campos_vacios);
      }
      Desde = new Date(Desde)
      Desde.setHours(0, 0, 0, 0)
      const arrayCUITs: any[] = CUITs.split(/\D+/).filter(Boolean);

      for (const CUIT of arrayCUITs) {

        if (CUIT.length != 11) {
          errors.push(`El CUIT ${CUIT} no tiene el formato correcto.`)
          continue
        }
        const PersonalCUITCUIL = await queryRunner.query(`
          SELECT cuit.PersonalId, PersonalCUITCUILCUIT
          FROM PersonalCUITCUIL cuit 
          WHERE cuit.PersonalCUITCUILCUIT IN (@0) AND PersonalCUITCUILHasta IS NULL
        `, [CUIT])
        if (!PersonalCUITCUIL.length) {
          errors.push(`No se pudo identificar el CUIT ${CUIT}.`)
          continue
        }
        const PersonalId = PersonalCUITCUIL[0].PersonalId

        await PersonalController.setPersonalBancoQuerys(queryRunner, PersonalId, BancoId, Desde, null, IndNuevaCuenta, fechaActual, usuario, ip)
      }

      if (errors.length) {
        throw new ClientException(errors)
      }

      await queryRunner.commitTransaction()
      this.jsonRes({}, res, 'Carga Exitosa');
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

}