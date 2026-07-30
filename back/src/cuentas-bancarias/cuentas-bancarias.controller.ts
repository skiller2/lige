import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL, getOptionsSINO } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";
import { FileUploadController } from "../controller/file-upload.controller.ts";
import type { QueryRunner } from "typeorm";
import xlsx from 'node-xlsx';
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { logger } from "../logger/logger.ts";

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
    const bancoIdRequest = Number(req.body.BancoId)
    const file = req.body.file
    const queryRunner = await getConnection(res.locals.userName);
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)
    const fechaActual: Date = new Date()
    let den_documento: string = ''
    let columnsnNotFound = []
    let dataset: any = []
    let idError: number = 0
    let altaCuentasBancarias = 0
    let cuentasSinModificar = 0
    let docFilePath: string | null = null
    let EventoLogCodigo = 0
    let campos_vacios: any[] = [];

    try {
      ({ EventoLogCodigo } = await this.eventoLogInicio(
        queryRunner,
        `Importación xls Cuentas Bancarias ${bancoIdRequest}`,
        { BancoId: bancoIdRequest, usuario, ip },
        usuario,
        ip,
        "LIQ"
      ))

      await queryRunner.startTransaction();

      if (!bancoIdRequest) campos_vacios.push(`- Banco`)
      if (campos_vacios.length) {
        campos_vacios.unshift('Debe completar los siguientes campos: ')
        throw new ClientException(campos_vacios)
      }

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

      den_documento = `Alta-Cuentas-Bancarias-${bancoIdRequest}`
      const docDescuentoObjetivo = await FileUploadController.handleDOCUpload(null, null, null, null, fechaActual, null, den_documento, fechaActual.getFullYear(), fechaActual.getMonth() + 1, file[0], usuario, ip, queryRunner)
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
          const result = await this.updateCuentasPendientes(queryRunner, PersonalId, bancoIdRequest, CBU, fechaActual, usuario, ip)
          altaCuentasBancarias += result?.cuentasModificadas || 0
          cuentasSinModificar += result?.cuentasSinModificar || 0

        } catch (error) {
          dataset.push({ id: idError++, CUIT, Detalle: `${error.message || error}` })
          continue
        }

      }

      if (dataset.length > 0) {
        throw new ClientException(`Hubo ${dataset.length} errores que no permiten importar el archivo.`, { list: dataset })
      }

      await queryRunner.commitTransaction();

      const successMessage = `- Registros modificados: ${altaCuentasBancarias}.\n- Registros sin modificar: ${cuentasSinModificar}.`;

      await this.eventoLogFin(
        queryRunner,
        EventoLogCodigo,
        'COM',
        { res: successMessage, 'Alta': altaCuentasBancarias, 'Sin Modificar': cuentasSinModificar, list: JSON.stringify(dataset) },
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

  async addCuentasPendientes(req: any, res: Response, next: NextFunction) {
    const fechaActual = new Date()
    const ip = this.getRemoteAddress(req)
    const usuario = res.locals.userName
    const queryRunner = await getConnection(usuario);
    const CUITs: string = req.body.CUITs
    const BancoId: number = req.body.BancoId
    let Desde = req.body.Desde
    let errors: any[] = []
    let registrosProcesados = 0

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

        if (errors.length) {
          throw new ClientException(errors)
        }

        const PersonalId = PersonalCUITCUIL[0].PersonalId

        await CuentasBancariasController.setCuentasPendientes(queryRunner, PersonalId, BancoId, Desde, fechaActual, usuario, ip)
        registrosProcesados++
      }



      await queryRunner.commitTransaction()
      this.jsonRes({ registrosProcesados }, res, 'Carga Exitosa. Registros dados de alta correctamente: ' + registrosProcesados);
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async setPersonalBanco(req: any, res: Response, next: NextFunction) {
    const fechaActual = new Date()
    const ip = this.getRemoteAddress(req)
    const usuario = res.locals.userName
    const queryRunner = await getConnection(usuario);
    const PersonalId: number = Number(req.body.PersonalId);
    const BancoId: number = req.body.BancoId
    const CBU = req.body.CBU?.trim() || null
    let Desde = req.body.Desde
    const IndNuevaCuenta = CBU ? 0 : 1

    try {
      let campos_vacios: any[] = []
      await queryRunner.startTransaction()

      if (!PersonalId) campos_vacios.push(`- Persona`);

      if (!BancoId) campos_vacios.push(`- Banco`);
      //if (!CBU) campos_vacios.push(`- CBU`);
      if (!Desde) campos_vacios.push(`- Fecha Desde`);
      if (campos_vacios.length) {
        campos_vacios.unshift('Debe completar los siguientes campos:')
        throw new ClientException(campos_vacios);
      }
      //Sin CBU se da de alta una cuenta pendiente, por eso sólo se valida el formato cuando viene informado
      if (CBU && !this.isCBU(CBU))
        throw new ClientException('El CBU debe ser de 22 digitos y tener el formato correcto.')


      Desde = new Date(Desde)
      Desde.setHours(0, 0, 0, 0)

      if (IndNuevaCuenta == 1) {
        await CuentasBancariasController.setCuentasPendientes(queryRunner, PersonalId, BancoId, Desde, fechaActual, usuario, ip)
      } else {
        await CuentasBancariasController.setPersonalBancoQuerys(queryRunner, PersonalId, BancoId, Desde, CBU, fechaActual, usuario, ip)
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

  static async setPersonalBancoQuerys(
    queryRunner: any,
    PersonalId: number,
    BancoId: number,
    Desde: Date,
    CBU: string,
    FechaActual: Date,
    usuario: string,
    ip: string
  ) {
    const PersonalBancoRows: any = await queryRunner.query(`
        SELECT pb.PersonalBancoId, pb.PersonalId, pb.PersonalBancoBancoId, pb.PersonalBancoDesde, pb.PersonalBancoHasta, pb.IndNuevaCuenta, pb.PersonalBancoCBU,
          CONCAT(trim(per.PersonalApellido), ', ', trim(per.PersonalNombre)) ApellidoNombre, cuit.PersonalCUITCUILCUIT CUIT, TRIM(ban.BancoDescripcion) BancoDescripcion
        FROM PersonalBanco pb
        left JOIN Banco ban ON ban.BancoId = pb.PersonalBancoBancoId
        Left JOIN Personal per ON per.PersonalId = pb.PersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
        WHERE ((@0 <= isnull(pb.PersonalBancoHasta, '9999-12-31') and @0 >= pb.PersonalBancoDesde) OR pb.PersonalBancoDesde >= @0)
           ORDER BY pb.PersonalBancoDesde DESC
      `, [FechaActual])

    // Validación de CBU EXISTENTE
    const existCBU = PersonalBancoRows.filter((r: any) => r.PersonalBancoCBU == CBU)
    if (existCBU.length > 0)
      throw new ClientException(`El CBU ingresado se encuentra registrado y vigente en una persona. (${existCBU[0].ApellidoNombre} - CUIT: ${existCBU[0].CUIT ? existCBU[0].CUIT : ''})`);

    const PersonalBanco: any = PersonalBancoRows.filter((r: any) => r.PersonalId === PersonalId)

    const cbuPendientes: any = PersonalBanco.filter((r: any) => (r.PersonalBancoCBU == null || r.PersonalBancoCBU == '') && r.IndNuevaCuenta == 1)

    // ALTA de cuenta sin historial en la PersonalBanco
    if (PersonalBanco.length == 0) {
      const Personal: any = await queryRunner.query(`
        SELECT ISNULL(PersonalBancoUltNro, 0)+1 UltNro
        FROM Personal
        WHERE PersonalId IN (@0)
      `, [PersonalId])
      const newPersonalBancoId: number = Personal[0].UltNro
      await queryRunner.query(`
        INSERT INTO PersonalBanco (PersonalId, PersonalBancoId, PersonalBancoBancoId, PersonalBancoCBU, PersonalBancoDesde, IndNuevaCuenta,
        AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod)
        VALUES (@0, @1, @2, @3, @4, @5, @6, @6, @7, @7, @8, @8)

        UPDATE Personal SET PersonalBancoUltNro = @1 WHERE PersonalId IN (@0)
      `, [PersonalId, newPersonalBancoId, BancoId, CBU, Desde, 0, FechaActual, usuario, ip])

      return
    }

    let resPersonalBancoId = null
    let registroActualizado = false

    for (const pb of PersonalBanco) {
      if (pb.PersonalBancoDesde.getTime() > Desde.getTime()) {
        throw new ClientException(`La fecha Desde no puede ser menor a la fecha ${pb.PersonalBancoDesde.getDate()}/${pb.PersonalBancoDesde.getMonth() + 1}/${pb.PersonalBancoDesde.getFullYear()} (Banco: ${pb.BancoDescripcion})`)
      }

      // actualizo registro (falta que se actualice el hasta de los otros)
      if (pb.PersonalBancoDesde.getTime() == Desde.getTime() && pb.PersonalBancoBancoId == BancoId) {
        await queryRunner.query(`
        UPDATE PersonalBanco SET
        PersonalBancoCBU = @3,
        IndNuevaCuenta = @4,
        AudFechaMod = @5,
        AudUsuarioMod = @6,
        AudIpMod= @7
        WHERE PersonalId IN (@0) AND PersonalBancoBancoId IN (@1) AND PersonalBancoId IN (@2)
      `, [PersonalId, BancoId, pb.PersonalBancoId, CBU, 0, FechaActual, usuario, ip])

        resPersonalBancoId = pb.IndNuevaCuenta ? pb.PersonalBancoId : null
        registroActualizado = true
        break
      }
    }

    if (!registroActualizado && cbuPendientes.length > 0) {
      throw new ClientException(`No se puede dar de alta la cuenta. La persona cuenta con CBU pendiente de carga.`)
    }

    if (!registroActualizado) {
      // creo el nuevo registro si no hay update
      const Personal: any = await queryRunner.query(`
        SELECT ISNULL(PersonalBancoUltNro, 0)+1 UltNro
        FROM Personal
        WHERE PersonalId IN (@0)
      `, [PersonalId])
      const newPersonalBancoId: number = Personal[0].UltNro
      await queryRunner.query(`
        INSERT INTO PersonalBanco (PersonalId, PersonalBancoId, PersonalBancoBancoId, PersonalBancoCBU, PersonalBancoDesde, IndNuevaCuenta,
        AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod)
        VALUES (@0, @1, @2, @3, @4, @5, @6, @6, @7, @7, @8, @8)

        UPDATE Personal SET PersonalBancoUltNro = @1 WHERE PersonalId IN (@0)
      `, [PersonalId, newPersonalBancoId, BancoId, CBU, Desde, 0, FechaActual, usuario, ip])

      resPersonalBancoId = newPersonalBancoId
    }

    if (resPersonalBancoId) {
      const newHasta: Date = new Date(Desde)
      newHasta.setDate(newHasta.getDate() - 1)
      await queryRunner.query(`
          UPDATE PersonalBanco SET
          PersonalBancoHasta = @2,
          AudFechaMod = @3,
          AudUsuarioMod = @4,
          AudIpMod=@5
          WHERE PersonalId IN (@0) AND PersonalBancoId != @1 AND IndNuevaCuenta = 0
          AND @3 <= isnull(PersonalBancoHasta, '9999-12-31') and @3 >= PersonalBancoDesde
        `, [PersonalId, resPersonalBancoId, newHasta, FechaActual, usuario, ip])

    }
  }

  async updateCuentasPendientes(queryRunner: any, PersonalId: number, BancoId: number, CBU: string, FechaActual: Date, usuario: string, ip: string) {

    const personalBancoRows: any = await queryRunner.query(`
        SELECT pb.PersonalBancoId, pb.PersonalId, pb.PersonalBancoBancoId, pb.PersonalBancoDesde, pb.PersonalBancoHasta, pb.IndNuevaCuenta, pb.PersonalBancoCBU,
          CONCAT(trim(per.PersonalApellido), ', ', trim(per.PersonalNombre)) ApellidoNombre, cuit.PersonalCUITCUILCUIT CUIT, TRIM(ban.BancoDescripcion) BancoDescripcion
        FROM PersonalBanco pb
        left JOIN Banco ban ON ban.BancoId = pb.PersonalBancoBancoId
        Left JOIN Personal per ON per.PersonalId = pb.PersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
        WHERE ((@0 <= isnull(pb.PersonalBancoHasta, '9999-12-31') and @0 >= pb.PersonalBancoDesde) OR pb.PersonalBancoDesde >= @0)
           ORDER BY pb.PersonalBancoDesde DESC
      `, [FechaActual])

    const PersonalBanco: any = personalBancoRows.filter((r: any) => r.PersonalId === PersonalId)

    // Registro marcado como cuenta nueva que todavía está esperando el CBU
    const cuentaNuevaPendiente = PersonalBanco.filter((r: any) => r.IndNuevaCuenta == 1 && (r.PersonalBancoCBU == null || r.PersonalBancoCBU == ''))
    if (cuentaNuevaPendiente.length > 1)
      throw new ClientException(`No se puede dar de alta la cuenta. Registros pendientes de CBU: ${cuentaNuevaPendiente.length} (Inconsistencia de datos).`)

    if (cuentaNuevaPendiente.length == 0) return { cuentasSinModificar: 1 }

    // Validación de CBU EXISTENTE
    const existPersonalBanco = personalBancoRows.filter((r: any) => r.PersonalBancoCBU == CBU && r.IndNuevaCuenta == 0 && (r.PersonalBancoCBU != null && r.PersonalBancoCBU != ''))
    if (existPersonalBanco.length && CBU != '' && CBU != null)
      throw new ClientException(`El CBU ingresado se encuentra registrado y vigente en una persona. (${existPersonalBanco[0].ApellidoNombre} - CUIT: ${existPersonalBanco[0].CUIT ? existPersonalBanco[0].CUIT : ''})`);

    // buscar si tiene vigente mas de un cbu, si encuentra mas de uno, no se permite dar de alta la cuenta nueva. Se debera cerrar el vigente y luego dar de alta la nueva
    const cbuVigentes = PersonalBanco.filter((r: any) => r.PersonalBancoCBU && r.IndNuevaCuenta == 0)

    // NO SE CONTEMPLA SI SE TIENE MAS DE UN REGISTRO VIGENTE, YA QUE NO DEBERIA EXISTIR MAS DE UNO
    if (cbuVigentes.length > 1)
      throw new ClientException(`No se puede dar de alta la cuenta. Registros vigentes y a futuros: ${cbuVigentes.length} (Inconsistencia de datos).`)


    // Mientras esa cuenta siga pendiente no se permite generar otra: hay que completar el CBU de la
    // existente, ya sea por la importación del XLS o manualmente desde el drawer
    if (!CBU?.trim()) {
      throw new ClientException(`EL CBU del archivo esta vacío`)
    }

    const newHasta: Date = new Date(cuentaNuevaPendiente[0].PersonalBancoDesde)
    newHasta.setDate(newHasta.getDate() - 1)
    newHasta.setHours(0, 0, 0, 0)

    if (cbuVigentes.length == 1 && newHasta.getTime() < cbuVigentes[0].PersonalBancoDesde.getTime()) {
      throw new ClientException(`La fecha de cierre del CBU vigente no puede ser menor a la fecha desde del mismo (Desde: ${cbuVigentes[0].PersonalBancoDesde.toLocaleDateString()} / Nuevo Hasta: ${newHasta.toLocaleDateString()})`)
    }

    await queryRunner.query(`
        UPDATE PersonalBanco SET
        PersonalBancoCBU = @2,
        IndNuevaCuenta = 0,
        AudFechaMod = @3,
        AudUsuarioMod = @4,
        AudIpMod= @5
        WHERE PersonalId = @0 AND PersonalBancoId = @1
      `, [cuentaNuevaPendiente[0].PersonalId, cuentaNuevaPendiente[0].PersonalBancoId, CBU, FechaActual, usuario, ip])

    // cerrar el registro vigente, ya que ahora se completa la cuenta nueva con un CBU
    if (cbuVigentes.length == 1) {
      await queryRunner.query(`
          UPDATE PersonalBanco SET
          PersonalBancoHasta = @2,
          AudFechaMod = @3,
          AudUsuarioMod = @4,
          AudIpMod=@5
          WHERE PersonalId = @0 AND PersonalBancoId = @1 and PersonalBancoDesde <= @3 AND isnull(PersonalBancoHasta, '9999-12-31')>= @3 and IndNuevaCuenta = 0
        `, [PersonalId, cbuVigentes[0].PersonalBancoId, newHasta, FechaActual, usuario, ip])
    }
    return { cuentasModificadas: 1 }
  }

  static async setCuentasPendientes(queryRunner: any, PersonalId: number, BancoId: number, Desde: Date, FechaActual: Date, usuario: string, ip: string) {

    const PersonalBanco: any = await queryRunner.query(`
        SELECT pb.PersonalBancoId, pb.PersonalId, pb.PersonalBancoBancoId, pb.PersonalBancoDesde, pb.PersonalBancoHasta, pb.IndNuevaCuenta, pb.PersonalBancoCBU,
          CONCAT(trim(per.PersonalApellido), ', ', trim(per.PersonalNombre)) ApellidoNombre, cuit.PersonalCUITCUILCUIT CUIT, TRIM(ban.BancoDescripcion) BancoDescripcion
        FROM PersonalBanco pb
        left JOIN Banco ban ON ban.BancoId = pb.PersonalBancoBancoId
        Left JOIN Personal per ON per.PersonalId = pb.PersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
        WHERE ((@0 <= isnull(pb.PersonalBancoHasta, '9999-12-31') and @0 >= pb.PersonalBancoDesde) OR pb.PersonalBancoDesde >= @0) AND pb.PersonalId = @1
      `, [FechaActual, PersonalId])

    const cuentaNuevaPendiente = PersonalBanco.filter((r: any) => r.IndNuevaCuenta == 1 && (r.PersonalBancoCBU == null || r.PersonalBancoCBU == ''))
    // Mientras esa cuenta siga pendiente no se permite generar otra: hay que completar el CBU de la existente, ya sea por la importación del XLS o manualmente desde el drawer
    if (cuentaNuevaPendiente.length > 0) throw new ClientException(`La persona cuenta con CBU pendiente de carga.`)


    // valido que no haya mas de un registro vigente o a futuro que tenga desde mayor o igual a la fecha desde de la cuenta pendiente que se quiere dar de alta
    const res = PersonalBanco.filter((r: any) => r.PersonalBancoDesde >= Desde)
    if (res.length > 0) throw new ClientException(`La fecha desde de la cuenta pendiente debe ser mayor a ${res[0].PersonalBancoDesde.toLocaleDateString()}. (${res[0].ApellidoNombre} - CUIT: ${res[0].CUIT ? res[0].CUIT : ''})`)

    const Personal: any = await queryRunner.query(`
        SELECT ISNULL(PersonalBancoUltNro, 0)+1 UltNro
        FROM Personal 
        WHERE PersonalId IN (@0)
      `, [PersonalId])
    const newPersonalBancoId: number = Personal[0].UltNro
    await queryRunner.query(`
        INSERT INTO PersonalBanco (PersonalId, PersonalBancoId, PersonalBancoBancoId, PersonalBancoCBU, PersonalBancoDesde, IndNuevaCuenta,
        AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod)
        VALUES (@0, @1, @2, @3, @4, @5, @6, @6, @7, @7, @8, @8)

        UPDATE Personal SET PersonalBancoUltNro = @1 WHERE PersonalId IN (@0)
      `, [PersonalId, newPersonalBancoId, BancoId, null, Desde, 1, FechaActual, usuario, ip])
  }
}


