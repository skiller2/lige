import { NextFunction, query, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource, getConnection } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";

const optionsSelect: any[] = [
  { label: 'Ayuda Asistencial', value: 1 },
  { label: 'Adelanto', value: 7 },
]

const getOptions: any[] = [
  { label: 'Si', value: '1' },
  { label: 'No', value: '0' }
]


const getOptionsPersonalPrestamoAprobado: any[] = [
  { label: 'Aprobado', value: 'S' },
  { label: 'Rechazado', value: 'N' },
  { label: 'Anulado', value: 'A' },
  { label: 'Pendiente', value: null }
]

const columnsAyudaAsistencial: any[] = [
  {
    id: "cuit",
    name: "CUIT",
    field: "PersonalCUITCUILCUIT",
    type: "string",
    fieldName: "cuit.PersonalCUITCUILCUIT",
    sortable: true,
    searchHidden: true
  },
  {
    id: "ApellidoNombre",
    name: "Apellido Nombre",
    field: "ApellidoNombre",
    type: "string",
    fieldName: "per.PersonalId",
    searchComponent: "inpurForPersonalSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "personalId",
    name: "PersonalId",
    field: "personalId",
    type: "number",
    fieldName: "per.PersonalId",
    sortable: true,
    searchHidden: true,
    hidden: true,
  },
  {
    id: "tipo",
    name: "Tipo",
    type: "string",
    field: "FormaPrestamoDescripcion",
    fieldName: "form.FormaPrestamoId",
    searchComponent: "inpurForTipoPrestamoSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false
  },
  // {
  //   id: "tipoId",
  //   name: "TipoId",
  //   type: "number",
  //   field: "FormaPrestamoId",
  //   fieldName: "form.FormaPrestamoId",
  //   sortable: true,
  //   searchHidden: true,
  //   hidden: true
  // },
  // {
  //   id: "liquidoFinanzas",
  //   name: "Liquido Finanzas",
  //   type: "string",
  //   field: "PersonalPrestamoLiquidoFinanzas",
  //   fieldName: "pres.PersonalPrestamoLiquidoFinanzas",
  //   formatter: 'collectionFormatter',
  //   params: { collection: getOptions, },
  //   searchType: "boolean",
  //   sortable: true,
  //   searchHidden: false
  // },
  {
    id: "PersonalPrestamoAudFechaIng",
    name: "Fecha Solicitud",
    field: "PersonalPrestamoAudFechaIng",
    type: "date",
    fieldName: "pres.PersonalPrestamoAudFechaIng",
    searchComponent: "inpurForFechaSearch",
    searchType: "date",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "PersonalPrestamoFechaAprobacion",
    name: "Fecha Aprobado",
    field: "PersonalPrestamoFechaAprobacion",
    type: "date",
    fieldName: "pres.PersonalPrestamoFechaAprobacion",
    searchComponent: "inpurForFechaSearch",
    searchType: "date",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "PersonalPrestamoAplicaEl",
    name: "Aplica El",
    type: "string",
    field: "PersonalPrestamoAplicaEl",
    fieldName: "pres.PersonalPrestamoAplicaEl",
    searchComponent: "inpurForPeriodoSearch",
    searchType: "string",
    sortable: true,
    searchHidden: false
  },
  {
    id: "PersonalPrestamoCantidadCuotas",
    name: "Cant. Cuotas",
    type: "number",
    field: "PersonalPrestamoCantidadCuotas",
    fieldName: "pres.PersonalPrestamoCantidadCuotas",
    searchType: "number",
    searchComponent: "inpurForNumberAdvancedSearch",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "PersonalPrestamoMonto",
    name: "Importe",
    field: "PersonalPrestamoMonto",
    type: "currency",
    fieldName: "pres.PersonalPrestamoMonto",
    searchComponent: "inpurForNumberAdvancedSearch",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "PersonalPrestamoMotivo",
    name: "Motivo",
    field: "PersonalPrestamoMotivo",
    type: "string",
    fieldName: "pres.PersonalPrestamoMotivo",
    searchType: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },

  {
    id: "PersonalPrestamoAprobado",
    name: "Estado",
    type: "string",
    field: "PersonalPrestamoAprobado",
    fieldName: "pres.PersonalPrestamoAprobado",
    formatter: 'collectionFormatter',
    params: { collection: getOptionsPersonalPrestamoAprobado, },
    searchComponent: "inpurForPrestamoAprobadoSearch",
    searchType: "string",
    sortable: true,
    searchHidden: false
  },
  {
    id: "SituacionRevistaDescripcion",
    name: "Situación Revista",
    type: "string",
    field: "SituacionRevistaDescripcion",
    fieldName: "sit.SituacionRevistaDescripcion",
    searchType: "string",
    sortable: true,
  },
  {
    name: "Grupo Actividad",
    type: "string",
    id: "gaCom",
    field: "gaCom",
    fieldName: "gaper.gaCom",
    sortable: true,
    searchHidden: true
  },
  {
    name: "Grupo Actividad",
    type: "number",
    id: "GrupoActividadId",
    field: "GrupoActividadId",
    fieldName: "gaper.GrupoActividadId",
    searchComponent: 'inputForGrupoActividadSearch',
    sortable: false,
    hidden: true,
    searchHidden: false
  },
];


const columnsAyudaAsistencialCuotas: any[] = [
  {
    id: 'id', name: 'Id', field: 'id',
    fieldName: 'id',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: 'PersonalCUITCUILCUIT', name: 'CUIT', field: 'PersonalCUITCUILCUIT',
    fieldName: 'cuit.PersonalCUITCUILCUIT',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: "ApellidoNombre",
    name: "Apellido Nombre",
    field: "ApellidoNombre",
    type: "string",
    fieldName: "per.PersonalId",
    searchComponent: "inpurForPersonalSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: 'tipocuenta_id', name: 'Tipo Cuenta', field: 'tipocuenta_id',
    fieldName: 'perdes.tipocuenta_id',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchComponent: 'inputForTipoCuentaSearch',
  },
  // {
  //   id: 'DescuentoId', name: 'Tipo Descuento', field: 'DescuentoId',
  //   fieldName: 'tipdes.DescuentoId',
  //   type: 'number',
  //   searchComponent: "inputForTipoDescuentoSearch",
  //   searchType: 'number',
  //   sortable: true,
  //   hidden: true,
  //   searchHidden: false,
  // },
  // {
  //   id: 'DescuentoDescripcion', name: 'Tipo Descuento', field: 'DescuentoDescripcion',
  //   fieldName: 'tipdes.DescuentoDescripcion',
  //   type: 'string',
  //   searchType: 'string',
  //   sortable: true,
  //   hidden: false,
  //   searchHidden: true,
  // },
  // {
  //   id: 'mes', name: 'Mes', field: 'mes',
  //   fieldName: 'perdes.mes',
  //   type: 'number',
  //   searchType: 'number',
  //   sortable: true,
  //   hidden: false,
  //   searchHidden: true,
  //   maxWidth: 50,
  //   minWidth: 10,
  // },
  // {
  //   id: 'anio', name: 'Año', field: 'anio',
  //   fieldName: 'perdes.anio',
  //   type: 'number',
  //   searchType: "number",
  //   sortable: true,
  //   hidden: false,
  //   searchHidden: true,
  //   maxWidth: 50,
  //   minWidth: 10,
  // },
  {
    id: 'periodo', name: 'Periodo', field: 'periodo',
    fieldName: "CONCAT(perdes.anio, '/', perdes.mes)",
    type: 'string',
    searchType: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: 'desmovimiento', name: 'Tipo', field: 'desmovimiento',
    fieldName: 'perdes.desmovimiento',
    type: 'string',
    searchType: "string",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'importe', name: 'Importe Cuota', field: 'importe',
    fieldName: "perdes.importe",
    type: 'currency',
    searchType: "currency",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: 'cuotanro', name: 'Cuota Nro.', field: 'cuotanro',
    fieldName: 'perdes.cuotanro',
    type: 'number',
    searchType: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'cantcuotas', name: 'Cantidad Cuotas', field: 'cantcuotas',
    fieldName: 'perdes.cantcuotas',
    type: 'number',
    searchType: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'importetotal', name: 'Importe Total', field: 'importetotal',
    fieldName: 'perdes.importetotal',
    type: 'currency',
    searchType: "currency",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'FechaAnulacion', name: 'Fecha Anulación', field: 'FechaAnulacion',
    fieldName: 'perdes.FechaAnulacion',
    type: 'date',
    searchComponent: "inpurForFechaSearch",
    searchType: 'date',
  }


]

export class AyudaAsistencialController extends BaseController {

  async personalPrestamoAprobadoQuery(
    queryRunner: any, personalPrestamoId: number, personalId: number, PersonalPrestamoAplicaEl: string,
    PersonalPrestamoCantidadCuotas: number, PersonalPrestamoMonto: number, usuario: string, ip: string
  ) {
    const PersonalPrestamoAprobado = 'S'
    const PersonalPrestamoFechaAprobacion = new Date()
    const prestamo = await queryRunner.query(`
      UPDATE PersonalPrestamo
      SET PersonalPrestamoAprobado = @2, PersonalPrestamoAplicaEl = @3, PersonalPrestamoCantidadCuotas = @4,
      PersonalPrestamoMontoAutorizado = @5, PersonalPrestamoMonto = @5, PersonalPrestamoFechaAprobacion = @6,
      PersonalPrestamoAudFechaMod = @6, PersonalPrestamoAudUsuarioMod = @7, PersonalPrestamoAudIpMod = @8
      WHERE PersonalPrestamoId = @0 AND PersonalId = @1
    `, [personalPrestamoId, personalId, PersonalPrestamoAprobado, PersonalPrestamoAplicaEl,
      PersonalPrestamoCantidadCuotas, PersonalPrestamoMonto, PersonalPrestamoFechaAprobacion, usuario, ip]
    )

    const periodo = this.valAplicaEl(PersonalPrestamoAplicaEl)
    console.log('periodo', periodo, 'cuotas', PersonalPrestamoCantidadCuotas)

    let PersonalPrestamoCuotaId = 0
    let cuotaAnio = periodo.anio
    let cuotaMes = periodo.mes
    // divide el monto total para saber el valor de cada cuota

    const valorCuota = Number((Number(PersonalPrestamoMonto) / Number(PersonalPrestamoCantidadCuotas)).toFixed(2))
    for (let cuota = 1; cuota <= PersonalPrestamoCantidadCuotas; cuota++) {
      PersonalPrestamoCuotaId++
      console.log('cuota', cuota, ' - ', cuotaAnio, cuotaMes, 'id:', PersonalPrestamoCuotaId, ' valorCuota:', valorCuota)

      await this.personalPrestamoCuotaAddCuotaQuery(queryRunner, PersonalPrestamoCuotaId, personalPrestamoId, personalId, cuotaAnio, cuotaMes, valorCuota, usuario, ip)

      const per = this.getNextMonthYear(cuotaMes, cuotaAnio)
      cuotaAnio = per.cuotaAnio
      cuotaMes = per.cuotaMes
    }

    return prestamo

  }
  async personalPrestamoRechazadoQuery(queryRunner: any, personalPrestamoId: number, personalId: number, usuario: string, ip: string) {
    const PersonalPrestamoAprobado = 'N'
    const PersonalPrestamoAplicaEl = null
    const PersonalPrestamoUltimaLiquidacion = ''
    const PersonalPrestamoCantidadCuotas = 0
    const PersonalPrestamoMontoAutorizado = 0
    const PersonalPrestamoFechaAprobacion = null
    const now = new Date()

    return await queryRunner.query(`
      UPDATE PersonalPrestamo
      SET PersonalPrestamoAprobado = @2, PersonalPrestamoUltimaLiquidacion = @4,
      PersonalPrestamoCantidadCuotas = @5, PersonalPrestamoMontoAutorizado = @6, PersonalPrestamoFechaAprobacion = @7,
      PersonalPrestamoAudFechaMod = @8, PersonalPrestamoAudUsuarioMod = @9, PersonalPrestamoAudIpMod = @10
      WHERE PersonalPrestamoId = @0 AND PersonalId = @1
    `, [personalPrestamoId, personalId, PersonalPrestamoAprobado, PersonalPrestamoAplicaEl,
      PersonalPrestamoUltimaLiquidacion, PersonalPrestamoCantidadCuotas, PersonalPrestamoMontoAutorizado,
      PersonalPrestamoFechaAprobacion, now, usuario, ip]
    )
  }

  async updateRowPersonalPrestamoQuery(
    queryRunner: any, personalPrestamoId: number, personalId: number, PersonalPrestamoAplicaEl: string,
    PersonalPrestamoCantidadCuotas: number, PersonalPrestamoMonto: number, usuario: string, ip: string
  ) {
    const now = new Date()
    return await queryRunner.query(`
      UPDATE PersonalPrestamo
      SET PersonalPrestamoAplicaEl = @2, PersonalPrestamoCantidadCuotas = @3, PersonalPrestamoMonto = @4,
      PersonalPrestamoAudFechaMod = @5, PersonalPrestamoAudUsuarioMod = @6, PersonalPrestamoAudIpMod = @7
      WHERE PersonalPrestamoId = @0 AND PersonalId = @1
    `, [personalPrestamoId, personalId, PersonalPrestamoAplicaEl, PersonalPrestamoCantidadCuotas,
      PersonalPrestamoMonto, now, usuario, ip]
    )
  }

  async deletePersonalPrestamoCuotasQuery(
    queryRunner: any, personalPrestamoId: number, personalId: number
  ) {
    return await queryRunner.query(`
      DELETE FROM PersonalPrestamoCuota
      WHERE PersonalPrestamoId = @0 AND PersonalId = @1
    `, [personalPrestamoId, personalId])
  }

  async getPersonalPrestamoByIdsQuery(queryRunner: any, personalPrestamoId: number, personalId: number) {
    return await queryRunner.query(`
      SELECT pres.*, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
      FROM PersonalPrestamo pres
      JOIN Personal per ON per.PersonalId=pres.PersonalId
      WHERE pres.PersonalPrestamoId = @0 AND pres.PersonalId = @1
      `, [personalPrestamoId, personalId])
  }

  async getPersonalPrestamoCuotasByIdsQuery(
    queryRunner: any, personalPrestamoId: number, personalId: number
  ) {
    return await queryRunner.query(`
      SELECT PersonalPrestamoCuotaId, PersonalPrestamoId, PersonalId,
      PersonalPrestamoCuotaAno anio, PersonalPrestamoCuotaMes mes, PersonalPrestamoCuotaImporte importe
      FROM PersonalPrestamoCuota ppc
      WHERE ppc.PersonalPrestamoId = @0 AND ppc.PersonalId = @1
      `, [personalPrestamoId, personalId])
  }

  async getPersonalPrestamoCuotaByPeriodoQuery(
    queryRunner: any, personalPrestamoId: number, personalId: number, anio: number, mes: number
  ) {
    return await queryRunner.query(`
      SELECT *
      FROM PersonalPrestamoCuota ppc
      WHERE ppc.PersonalPrestamoId = @0 AND ppc.PersonalId = @1 AND ppc.PersonalPrestamoCuotaAno = @2 AND ppc.PersonalPrestamoCuotaMes = @3
      `, [personalPrestamoId, personalId, anio, mes])
  }

  async getPeriodoQuery(queryRunner: any, anio: number, mes: number) {
    return await queryRunner.query(`
      SELECT periodo_id, anio, mes, ind_recibos_generados
      FROM lige.dbo.liqmaperiodo
      WHERE anio = @0 AND mes = @1
      `, [anio, mes])
  }

  async getReciboQuery(queryRunner: any, PersonalId: number, anio: number, mes: number) {
    return await queryRunner.query(`
      SELECT doc.DocumentoId
      FROM Documento doc 
      LEFT JOIN lige.dbo.liqmaperiodo liqp ON liqp.anio = doc.DocumentoAnio AND liqp.mes = doc.DocumentoMes
      WHERE doc.PersonalId = @0 AND liqp.anio = @1 AND liqp.mes = @2 AND doc.DocumentoTipoCodigo='REC' 
      `, [PersonalId, anio, mes])
  }

  async rowAyudaAsistencialQuery(queryRunner: any, personalPrestamoId: number, personalId: number) {
    return await queryRunner.query(`
      SELECT CONCAT(pres.PersonalPrestamoId,'-', per.PersonalId) id,
      CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, cuit.PersonalCUITCUILCUIT, pres.PersonalId, pres.PersonalPrestamoMonto,
      pres.PersonalPrestamoAudFechaIng, pres.PersonalPrestamoAudUsuarioIng, pres.PersonalPrestamoAudIpIng,
      pres.PersonalPrestamoAudFechaMod, pres.PersonalPrestamoAudUsuarioMod, pres.PersonalPrestamoAudIpMod,
      pres.PersonalPrestamoFechaAprobacion, pres.PersonalPrestamoCantidadCuotas,
      pres.PersonalPrestamoAplicaEl, form.FormaPrestamoId, form.FormaPrestamoDescripcion, IIF(pres.PersonalPrestamoLiquidoFinanzas=1,'1','0') PersonalPrestamoLiquidoFinanzas
      FROM PersonalPrestamo pres
      LEFT JOIN Personal per ON per.PersonalId = pres.PersonalId 
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = pres.PersonalId 
      LEFT JOIN FormaPrestamo form ON form.FormaPrestamoId = pres.FormaPrestamoId
      WHERE pres.PersonalPrestamoId = @0 AND pres.PersonalId = @1
    `, [personalPrestamoId, personalId])
  }

  async listAyudaAsistencialQuery(queryRunner: any, filterSql: any, orderBy: any, anio: number, mes: number) {
    return await queryRunner.query(`
      SELECT  CONCAT(pres.PersonalPrestamoId,'-', per.PersonalId) id,
      CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, cuit.PersonalCUITCUILCUIT, pres.PersonalId, pres.PersonalPrestamoMonto,
          pres.PersonalPrestamoAudFechaIng, pres.PersonalPrestamoAudUsuarioIng, pres.PersonalPrestamoAudIpIng,
          pres.PersonalPrestamoAudFechaMod, pres.PersonalPrestamoAudUsuarioMod, pres.PersonalPrestamoAudIpMod,
          IIF(pres.PersonalPrestamoAprobado='S', pres.PersonalPrestamoFechaAprobacion,null) PersonalPrestamoFechaAprobacion, pres.PersonalPrestamoCantidadCuotas,
          pres.PersonalPrestamoAplicaEl, pres.PersonalPrestamoMotivo,
          form.FormaPrestamoId, form.FormaPrestamoDescripcion, IIF(pres.PersonalPrestamoLiquidoFinanzas=1,'1','0') PersonalPrestamoLiquidoFinanzas,
          pres.PersonalPrestamoAprobado,
          sit.SituacionRevistaDescripcion,
        gaper.GrupoActividadId,
        gaper.gaCom,
      1
      FROM PersonalPrestamo pres
      JOIN Personal per ON per.PersonalId = pres.PersonalId 
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN FormaPrestamo form ON form.FormaPrestamoId = pres.FormaPrestamoId

      LEFT JOIN 
      (
      SELECT sitrev2.PersonalId, MAX(sitrev2.PersonalSituacionRevistaId) PersonalSituacionRevistaId
      FROM PersonalSituacionRevista sitrev2 
      JOIN PersonalPrestamo pres2 ON pres2.PersonalId = sitrev2.PersonalId
      WHERE sitrev2.PersonalSituacionRevistaDesde<=IIF(pres2.PersonalPrestamoAprobado='S',pres2.PersonalPrestamoFechaAprobacion,@2) AND  ISNULL(sitrev2.PersonalSituacionRevistaHasta,'9999-12-31') >= IIF(pres2.PersonalPrestamoAprobado='S',pres2.PersonalPrestamoFechaAprobacion,@2)
      GROUP BY sitrev2.PersonalId
      ) sitrev3  ON sitrev3.PersonalId = per.PersonalId
      LEFT JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND sitrev.PersonalSituacionRevistaId = sitrev3.PersonalSituacionRevistaId
              
      LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId



      OUTER APPLY (
      SELECT TOP 1 ga.GrupoActividadDetalle,gaux.GrupoActividadPersonalId,gaux.GrupoActividadPersonalPersonalId,gaux.GrupoActividadId, gaux.GrupoActividadPersonalDesde,gaux.GrupoActividadPersonalHasta,
    CASE 
      WHEN ga.GrupoActividadId IS NOT NULL THEN  
        CONCAT(TRIM(ga.GrupoActividadDetalle), ' (Desde: ', 
            FORMAT(gaux.GrupoActividadPersonalDesde, 'dd/MM/yyyy'), ' - Hasta: ', 
            CASE WHEN gaux.GrupoActividadPersonalHasta IS NULL THEN 'Actualidad' 
              ELSE FORMAT(gaux.GrupoActividadPersonalHasta, 'dd/MM/yyyy') 
            END, ')'
        )
      ELSE '' 
    END AS gaCom
      FROM GrupoActividadPersonal gaux
    LEFT JOIN GrupoActividad ga on ga.GrupoActividadId=gaux.GrupoActividadId

      WHERE 
          gaux.GrupoActividadPersonalPersonalId = per.PersonalId
          AND gaux.GrupoActividadPersonalDesde <= IIF(pres.PersonalPrestamoAprobado='S',pres.PersonalPrestamoFechaAprobacion,@2)
          AND ISNULL(gaux.GrupoActividadPersonalHasta,'9999-12-31') >= IIF(pres.PersonalPrestamoAprobado='S',pres.PersonalPrestamoFechaAprobacion,@2)
      ORDER BY 
          gaux.GrupoActividadId DESC,
          gaux.GrupoActividadPersonalId DESC
      ) gaper


              
          WHERE 
      (pres.PersonalPrestamoAprobado IS NULL
      OR DATEFROMPARTS(SUBSTRING(pres.PersonalPrestamoAplicaEl,4,4),SUBSTRING(pres.PersonalPrestamoAplicaEl,1,2),1) = DATEFROMPARTS(@0,@1,1) 
      )
      AND (${filterSql})
      ${orderBy}
    `, [anio, mes, new Date()])
  }

  async personalPrestamoCuotaAddCuotaQuery(
    queryRunner: any, personalPrestamoCuotaId: number, personalPrestamoId: number, personalId: number,
    anio: number, mes: number, importe: number, usuario: string, ip: string
  ) {
    const now = new Date()
    return await queryRunner.query(`
      INSERT PersonalPrestamoCuota (PersonalPrestamoCuotaId, PersonalPrestamoId, PersonalId,
      PersonalPrestamoCuotaAno, PersonalPrestamoCuotaMes, PersonalPrestamoCuotaCuota,
      PersonalPrestamoCuotaImporte, PersonalPrestamoCuotaMantiene,PersonalPrestamoCuotaFinaliza,PersonalPrestamoCuotaProceso, 
     AudUsuarioIng,AudIpIng,AudFechaIng,AudUsuarioMod,AudIpMod,AudFechaMod)
      VALUES (@0,@1,@2,@3,@4,@0,@5,@6,@6,@7, 
          @8,@9,@10,@8,@9,@10)
    `, [personalPrestamoCuotaId, personalPrestamoId, personalId, anio, mes, importe, 0, 'FA', usuario, ip, now])
  }

  async updateCuotaPersonalPrestamo(
    queryRunner: any, personalPrestamoId: number, personalId: number, ultCuota: number, anio: number, mes: number, usuario: string, ip: string
  ) {
    const now = new Date()
    return await queryRunner.query(`
      UPDATE PersonalPrestamo
      SET PersonalPrestamoUltimaLiquidacion = CONCAT(FORMAT(@2,'00'),'/',@3,' Cuota ', @4), PersonalPrestamoCuotaUltNro = @4,
      PersonalPrestamoAudFechaMod = @5, PersonalPrestamoAudUsuarioMod = @6, PersonalPrestamoAudIpMod = @7
      WHERE PersonalPrestamoId = @0 AND PersonalId = @1
    `, [personalPrestamoId, personalId, mes, anio, ultCuota, now, usuario, ip]
    )
  }

  async getLigmamovimientosQuery(
    queryRunner: any, personalId: number, anio: number, mes: number, tipocuenta_id: string
  ) {
    return await queryRunner.query(`
      SELECT *
      FROM lige.dbo.liqmamovimientos liqm
      LEFT JOIN lige.dbo.liqmaperiodo liqp ON liqp.periodo_id = liqm.periodo_id
      WHERE liqm.persona_id = @0 AND liqp.anio = @1 AND liqp.mes = @2 AND liqm.tipocuenta_id = @3
      `, [personalId, anio, mes, tipocuenta_id])
  }

  async personalPrestamoListAddCuotaQuery(
    queryRunner: any, anio: number, mes: number
  ) {
    return await queryRunner.query(`
      SELECT pp.PersonalPrestamoId, pp.PersonalId,
      CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
      ISNULL(pp.PersonalPrestamoCuotaUltNro, 0) AS PersonalPrestamoCuotaUltNro,
      ROUND(pp.PersonalPrestamoMontoAutorizado/pp.PersonalPrestamoCantidadCuotas, 2) AS PersonalPrestamoCuotaImporte
      FROM PersonalPrestamo pp
      LEFT JOIN Personal per ON per.PersonalId = pp.PersonalId 
      WHERE pp.PersonalPrestamoAprobado = 'S' AND pp.PersonalPrestamoCantidadCuotas > ISNULL(pp.PersonalPrestamoCuotaUltNro, 0)
      AND DATEADD(MONTH,  ISNULL(pp.PersonalPrestamoCuotaUltNro, 0),  DATEFROMPARTS(SUBSTRING(pp.PersonalPrestamoAplicaEl, 4, 4), SUBSTRING(pp.PersonalPrestamoAplicaEl, 1, 2), 1)) = DATEFROMPARTS(@0,@1,1)
      `, [anio, mes])
  }

  async getGridColumns(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columnsAyudaAsistencial, res)
  }

  async getAyudaAsistencialList(req: any, res: Response, next: NextFunction) {
    const anio = req.body.anio
    const mes = req.body.mes
    const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
    // if (options.filtros.length == 0) { 
    //   return this.jsonRes([], res);
    // }
    const filterSql = filtrosToSql(options.filtros, columnsAyudaAsistencial);
    const orderBy = orderToSQL(options.sort)
    const queryRunner = await getConnection();
    try {
      await queryRunner.startTransaction()

      let list = await this.listAyudaAsistencialQuery(queryRunner, filterSql, orderBy, anio, mes)

      await queryRunner.commitTransaction()
      return this.jsonRes(list, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async updateRowPersonalPrestamo(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner()
    const ids = req.body.id.split('-')
    const personalPrestamoId = Number.parseInt(ids[0])
    const personalId = Number.parseInt(ids[1])
    const personalPrestamoAplicaEl = req.body.PersonalPrestamoAplicaEl
    const personalPrestamoCantidadCuotas = req.body.PersonalPrestamoCantidadCuotas
    const personalPrestamoMonto = req.body.PersonalPrestamoMonto
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)

    try {
      await queryRunner.startTransaction()
      const periodo = this.valAplicaEl(personalPrestamoAplicaEl)
      if (!periodo)
        throw new ClientException('Aplica El no es válido')

      if (Number(personalPrestamoCantidadCuotas) <= 0)
        throw new ClientException('Cantidad de cuotas debe ser mayor a 0')

      if (parseFloat(personalPrestamoMonto) <= 0)
        throw new ClientException('El monto debe ser mayor a 0')



      const per = await this.getPeriodoQuery(queryRunner, periodo.anio, periodo.mes)
      if (per[0]?.ind_recibos_generados == 1)
        throw new ClientException(`No se puede modificar el período ${periodo.mes}/${periodo.anio}, ya que tiene los recibos generados.`)

      let PersonalPrestamo = await this.getPersonalPrestamoByIdsQuery(queryRunner, personalPrestamoId, personalId)
      if (!PersonalPrestamo.length)
        throw new ClientException('No se encuentra el registro.')
      PersonalPrestamo = PersonalPrestamo[0]

      if (PersonalPrestamo.PersonalPrestamoAprobado == 'S') {
        throw new ClientException('No se puede editar en estado APROBADO.')
      }

      await this.updateRowPersonalPrestamoQuery(queryRunner, personalPrestamoId, personalId, `${periodo.mes.toString().padStart(2, '0')}/${periodo.anio}`, personalPrestamoCantidadCuotas, personalPrestamoMonto, usuario, ip)

      let row = await this.rowAyudaAsistencialQuery(queryRunner, personalPrestamoId, personalId)

      await queryRunner.commitTransaction()
      return this.jsonRes(row[0], res, 'Carga Exitosa');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async personalPrestamoAprobar(queryRunner: any, personalPrestamoId: number, personalId: number, usuario: string, ip: string) {

    let PersonalPrestamo = await this.getPersonalPrestamoByIdsQuery(queryRunner, personalPrestamoId, personalId)
    if (!PersonalPrestamo.length)
      return new ClientException('No se encuentra el registro.')
    PersonalPrestamo = PersonalPrestamo[0]

    // Validaciones
    const periodo = this.valAplicaEl(PersonalPrestamo.PersonalPrestamoAplicaEl)
    if (!periodo || !PersonalPrestamo.PersonalPrestamoCantidadCuotas || !PersonalPrestamo.PersonalPrestamoMonto) {
      return new ClientException('Verifiquen que Cant Cuotas e Importe sean mayores a 0 y que Aplica El sea un periodo valido.')
    }

    if (PersonalPrestamo.PersonalPrestamoAprobado != null) {
      return new ClientException('El registro NO puede ser APROBADO.')
    }
    let recGenerados = await this.getPeriodoQuery(queryRunner, periodo.anio, periodo.mes)
    if (recGenerados[0]?.ind_recibos_generados == 1)
      return new ClientException(`Ya se encuentran generados los recibos para el período ${periodo.anio}/${periodo.mes}`)

    const recibos = await this.getReciboQuery(queryRunner, personalId, periodo.anio, periodo.mes)
    if (recibos.length)
      return new ClientException(`Ya existe un recibo para ${PersonalPrestamo.ApellidoNombre} del periodo ${PersonalPrestamo.PersonalPrestamoAplicaEl}, PersonalId=${personalId}`)

    await this.personalPrestamoAprobadoQuery(queryRunner, personalPrestamoId, personalId, PersonalPrestamo.PersonalPrestamoAplicaEl, PersonalPrestamo.PersonalPrestamoCantidadCuotas, PersonalPrestamo.PersonalPrestamoMonto, usuario, ip)

    let row = await this.rowAyudaAsistencialQuery(queryRunner, personalPrestamoId, personalId)
    return row[0]
  }

  async personalPrestamoAprobarList(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const ids: string[] = req.body.ids
    const numRows: number[] = req.body.rows
    let errors: string[] = []
    let numRowsError: number[] = []
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)

    try {
      await queryRunner.startTransaction()

      for (const [index, id] of ids.entries()) {
        const arrayIds = id.split('-')
        let personalPrestamoId = Number.parseInt(arrayIds[0])
        let personalId = Number.parseInt(arrayIds[1])
        let res = await this.personalPrestamoAprobar(queryRunner, personalPrestamoId, personalId, usuario, ip)
        if (res instanceof ClientException) {
          let name = await queryRunner.query(`
            SELECT CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
            FROM Personal per
            WHERE per.PersonalId = @0`,
            [personalId]
          )
          numRowsError.push(numRows[index])
          errors.push(`[FILA ${numRows[index] + 1}]${name[0].ApellidoNombre}: ` + res.messageArr[0])
        }
      }

      if (errors.length) {
        throw new ClientException(errors.join(`\n`), numRowsError)
      }

      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, 'Carga Exitosa');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async personalPrestamoRechazar(queryRunner: any, personalPrestamoId: number, personalId: number, usuario: string, ip: string) {
    let PersonalPrestamo = await this.getPersonalPrestamoByIdsQuery(queryRunner, personalPrestamoId, personalId)

    if (!PersonalPrestamo.length)
      return new ClientException('No se encuentra el registro.')
    PersonalPrestamo = PersonalPrestamo[0]

    // Validaciones
    if (PersonalPrestamo.PersonalPrestamoAprobado != 'S' && PersonalPrestamo.PersonalPrestamoAprobado != null)
      return new ClientException('El registro NO puede ser RECHAZADO.')
    if (PersonalPrestamo.PersonalPrestamoLiquidoFinanzas)
      return new ClientException('El registro ya se envió al banco.')
    if (PersonalPrestamo.PersonalPrestamoAplicaEl) {
      let cuotas = await this.getPersonalPrestamoCuotasByIdsQuery(queryRunner, personalPrestamoId, personalId)
      if (cuotas.length) {
        for (const cuota of cuotas) {
          const recibos = await this.getReciboQuery(queryRunner, personalId, cuota.anio, cuota.mes)
          if (recibos.length)
            return new ClientException(`Existe un recibo del período ${cuota.anio}/${cuota.mes} de este registro`)
        }
      }
    }

    await this.personalPrestamoRechazadoQuery(queryRunner, personalPrestamoId, personalId, usuario, ip)
    await this.deletePersonalPrestamoCuotasQuery(queryRunner, personalPrestamoId, personalId)

    let row = await this.rowAyudaAsistencialQuery(queryRunner, personalPrestamoId, personalId)

    return row[0]
  }

  async personalPrestamoRechazarList(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const ids: string[] = req.body.ids
    const numRows: number[] = req.body.rows
    let errors: string[] = []
    let numRowsError: number[] = []
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)

    try {
      await queryRunner.startTransaction()

      for (const [index, id] of ids.entries()) {
        const arrayIds = id.split('-')
        let personalPrestamoId = Number.parseInt(arrayIds[0])
        let personalId = Number.parseInt(arrayIds[1])

        let res = await this.personalPrestamoRechazar(queryRunner, personalPrestamoId, personalId, usuario, ip)
        if (res instanceof ClientException) {
          let name = await queryRunner.query(`
            SELECT CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
            FROM Personal per
            WHERE per.PersonalId = @0`,
            [personalId]
          )
          numRowsError.push(numRows[index])
          errors.push(`[FILA ${numRows[index] + 1}]${name[0].ApellidoNombre}: ` + res.messageArr[0])
        }
      }

      if (errors.length) {
        throw new ClientException(errors.join(`\n`), numRowsError)
      }

      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, 'Carga Exitosa');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async personalPrestamoCuotaAddCuota(
    queryRunner: any, personalPrestamoId: number, personalId: number, anio: number, mes: number,
    importeCuota: number, ultCuota: number, apellidoNombre: string, usuario: string, ip: string
  ) {
    ultCuota++

    let cuota = await this.getPersonalPrestamoCuotaByPeriodoQuery(queryRunner, personalPrestamoId, personalId, anio, mes)
    if (cuota.length) {
      return new ClientException(`La cuota para ${apellidoNombre} del período ${anio}/${mes} ya existe.`)
    }

    let ligm = await this.getLigmamovimientosQuery(queryRunner, personalId, anio, mes, 'G')
    if (!ligm.length) {
      return new ClientException(`${apellidoNombre} no tiene disponibilidad de su cuenta.`)
    }

    await this.personalPrestamoCuotaAddCuotaQuery(queryRunner, ultCuota, personalPrestamoId, personalId, anio, mes, importeCuota, usuario, ip)
    await this.updateCuotaPersonalPrestamo(queryRunner, personalPrestamoId, personalId, ultCuota, anio, mes, usuario, ip)

    return
  }

  async personalPrestamoListAddCuota(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const anio: number = req.body.year
    const mes: number = req.body.month
    let errors: string[] = []
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)

    try {

      throw new ClientException('Funcionalidad deshabilitada.')
      await queryRunner.startTransaction()

      const per = await this.getPeriodoQuery(queryRunner, anio, mes)
      if (per[0]?.ind_recibos_generados == 1)
        return new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}.`)
      const list = await this.personalPrestamoListAddCuotaQuery(queryRunner, anio, mes)

      for (const obj of list) {
        let res = await this.personalPrestamoCuotaAddCuota(
          queryRunner, obj.PersonalPrestamoId, obj.PersonalId, anio, mes,
          obj.PersonalPrestamoCuotaImporte, obj.PersonalPrestamoCuotaUltNro, obj.ApellidoNombre, usuario, ip)
        if (res instanceof ClientException) {
          errors.push(res.messageArr[0])
        }
      }

      // if (errors.length) {
      //   throw new ClientException(errors.join(`\n`))
      // }

      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, 'Carga Exitosa');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  getTipoPrestamo(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(optionsSelect, res)
  }

  getEstadoPrestamo(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(getOptionsPersonalPrestamoAprobado, res)
  }

  valAplicaEl(date: string): any {
    if (date == null) {
      return null
    }
    const periodo = date.split('/')
    if (periodo.length != 2) {
      return null
    }
    const mes = Number.parseInt(periodo[0])
    const anio = Number.parseInt(periodo[1])
    if (Number.isNaN(mes) || mes > 12 || mes < 1 || Number.isNaN(anio) || anio < 2000) {
      return null
    }
    return { anio, mes }
  }

  async addPersonalPrestamo(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const personalId = req.body.personalId
    const formaId = req.body.formaId
    const anio = new Date(req.body.aplicaEl).getFullYear()
    const mes = new Date(req.body.aplicaEl).getMonth() + 1
    const importe = req.body.importe
    const cantCuotas = req.body.cantCuotas
    const motivo: string = req.body.motivo
    const ip = req.socket.remoteAddress
    const usuario = res.locals.userName
    let prestamoId: number = 0
    let campos_vacios: any[] = []
    try {
      await queryRunner.startTransaction()

      if (!personalId) campos_vacios.push("- Persona-.");
      if (!formaId) campos_vacios.push("- Tipo.");
      if (!req.body.aplicaEl) campos_vacios.push("- Aplica El.");
      if (!cantCuotas) campos_vacios.push("- Cant. de Cuotas.");
      if (!importe) campos_vacios.push("- Importe.");
      if (!motivo.trim().length) campos_vacios.push("- Motivo.");

      if (campos_vacios.length) {
        campos_vacios.unshift('Debe completar los siguientes campos: ')
        throw new ClientException(campos_vacios)
      }

      const forma = optionsSelect.find((obj: any) => obj.value == formaId)

      if (!forma)
        throw new ClientException(`No se encontró el Tipo seleccionado ${formaId}`)

      const checkrecibos = await this.getPeriodoQuery(queryRunner, anio, mes)

      if (checkrecibos[0]?.ind_recibos_generados == 1)
        throw new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}, no se puede generar ${forma.label} para el período`)


      const aplicaEl = `${String(mes).padStart(2, '0')}/${String(anio).padStart(4, '0')}`

      const presPend = await queryRunner.query(`
        SELECT pre.PersonalPrestamoId 
        FROM PersonalPrestamo pre 
        WHERE pre.PersonalId = @0 AND pre.PersonalPrestamoAprobado = 'S' AND pre.PersonalPrestamoLiquidoFinanzas = 0 AND pre.FormaPrestamoId =@1`,
        [personalId, formaId]
      )
      if (presPend.length > 0)
        throw new ClientException(`Ya se encuentra generado, aprobado y pendiente de acreditar en cuenta.  No se puede solicitar nuevo ${forma.label}.`)


      await queryRunner.query(
        `DELETE From PersonalPrestamo 
        WHERE PersonalPrestamoAprobado IS NULL
        AND FormaPrestamoId = @1
        AND PersonalId = @0`,
        [personalId, formaId]
      );
      const now = new Date()

      if (importe > 0) {
        prestamoId = Number((await queryRunner.query(`
          SELECT per.PersonalPrestamoUltNro as max 
          FROM Personal per WHERE per.PersonalId = @0`,
          [personalId]
        ))[0].max) + 1;

        const result = await queryRunner.query(
          `INSERT INTO PersonalPrestamo (PersonalPrestamoId, PersonalId, PersonalPrestamoMonto, FormaPrestamoId, 
          PersonalPrestamoAprobado, PersonalPrestamoFechaAprobacion, PersonalPrestamoCantidadCuotas, PersonalPrestamoAplicaEl, 
          PersonalPrestamoLiquidoFinanzas, PersonalPrestamoUltimaLiquidacion, PersonalPrestamoCuotaUltNro, PersonalPrestamoMontoAutorizado, PersonalPrestamoMotivo,
          PersonalPrestamoAudFechaIng, PersonalPrestamoAudUsuarioIng, PersonalPrestamoAudIpIng, PersonalPrestamoAudFechaMod, PersonalPrestamoAudUsuarioMod, PersonalPrestamoAudIpMod)
          VALUES(@0, @1, @2, @3, 
          @4, @5, @6, @7, 
          @8, @9, @10, @11, @12, 
          @13, @14, @15, @13, @14, @15)`,
          [
            prestamoId, //PersonalPrestamoId
            personalId, //PersonalId
            importe, //PersonalPrestamoMonto
            formaId, //FormaPrestamoId = 7 Adelanto / 1 Ayuda Asistencial

            null, //PersonalPrestamoAprobado
            null, //PersonalPrestamoFechaAprobacion
            cantCuotas,  //PersonalPrestamoCantidadCuotas
            aplicaEl, //PersonalPrestamoAplicaEl

            null, //PersonalPrestamoLiquidoFinanzas
            "", //PersonalPrestamoUltimaLiquidacion
            null, //PersonalPrestamoCuotaUltNro
            0, //PersonalPrestamoMontoAutorizado
            motivo, //PersonalPrestamoMotivo

            now, usuario, ip, //Aud data

          ]
        );

        const resultAdelanto = await queryRunner.query(
          `UPDATE Personal SET PersonalPrestamoUltNro=@1 WHERE PersonalId=@0 `,
          [personalId, prestamoId]
        );

      }

      //      throw new ClientException(`todo bien.`)
      await queryRunner.commitTransaction()
      return this.jsonRes({ personalPrestamoId: prestamoId }, res, 'Carga Exitosa');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async updatePersonalPrestamo(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const personalId = req.body.personalId
    const formaId = req.body.formaId
    const personalPrestamoId = req.body.personalPrestamoId
    const anio = new Date(req.body.aplicaEl).getFullYear()
    const mes = new Date(req.body.aplicaEl).getMonth() + 1
    const importe = req.body.importe
    const cantCuotas = req.body.cantCuotas
    const motivo: string = req.body.motivo
    const ip = req.socket.remoteAddress
    const usuario = res.locals.userName
    const now = new Date()
    let prestamoId: number = 0
    let campos_vacios: any[] = []

    //throw new ClientException(`todo bien.`)
    try {
      await queryRunner.startTransaction()

      if (!personalId) campos_vacios.push("- Persona-.");
      if (!formaId) campos_vacios.push("- Tipo.");
      if (!req.body.aplicaEl) campos_vacios.push("- Aplica El.");
      if (!cantCuotas) campos_vacios.push("- Cant. de Cuotas.");
      if (!importe) campos_vacios.push("- Importe.");
      if (!motivo.trim().length) campos_vacios.push("- Motivo.");

      if (campos_vacios.length) {
        campos_vacios.unshift('Debe completar los siguientes campos: ')
        throw new ClientException(campos_vacios)
      }

      const forma = optionsSelect.find((obj: any) => obj.value == formaId)

      if (!forma)
        throw new ClientException(`No se encontró el Tipo seleccionado ${formaId}`)

      const checkrecibos = await this.getPeriodoQuery(queryRunner, anio, mes)

      if (checkrecibos[0]?.ind_recibos_generados == 1)
        throw new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}, no se puede generar ${forma.label} para el período`)


      const aplicaEl = `${String(mes).padStart(2, '0')}/${String(anio).padStart(4, '0')}`

      const presPend = await queryRunner.query(`
        SELECT pre.PersonalPrestamoId 
        FROM PersonalPrestamo pre 
        WHERE pre.PersonalId = @0 AND pre.PersonalPrestamoAprobado = 'S' AND pre.PersonalPrestamoLiquidoFinanzas = 0 AND pre.FormaPrestamoId =@1`,
        [personalId, formaId]
      )
      if (presPend.length > 0)
        throw new ClientException(`Ya se encuentra generado, aprobado y pendiente de acreditar en cuenta.  No se puede solicitar nuevo ${forma.label}.`)

      const result = await queryRunner.query(
        `UPDATE PersonalPrestamo SET PersonalPrestamoMonto = @2, PersonalPrestamoCantidadCuotas = @3, PersonalPrestamoAplicaEl = @4,
          PersonalPrestamoMotivo = @5, PersonalPrestamoAudFechaMod = @6, PersonalPrestamoAudUsuarioMod = @7, PersonalPrestamoAudIpMod = @8
           WHERE PersonalPrestamoId = @0 AND PersonalId = @1`,
        [personalPrestamoId, personalId, importe, cantCuotas, aplicaEl, motivo, now, usuario, ip]
      );
      //      throw new ClientException(`todo bien.`)
      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, 'Modificación Exitosa');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }


  async getPersonalPrestamoByPersonalId(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const personalId: number = Number(req.body.personalId)
    try {
      await queryRunner.startTransaction()

      let periodo = await queryRunner.query(
        `SELECT DATEADD(MONTH,  1,  MAX(DATEFROMPARTS(liqp.anio, liqp.mes, 1))) ultPeriodo
        FROM lige.dbo.liqmaperiodo liqp
        WHERE ind_recibos_generados = 1`
      );
      periodo = periodo[0].ultPeriodo
      const mes = periodo.getMonth() + 1
      const anio = periodo.getFullYear()

      let list = await queryRunner.query(
        `SELECT TOP 5 pre.PersonalPrestamoMonto, pre.PersonalPrestamoAudFechaIng, pre.PersonalPrestamoFechaAprobacion,
        CONCAT(@2,'/',@1) PersonalPrestamoUltimaLiquidacion, pre.PersonalPrestamoAprobado, TRIM(form.FormaPrestamoDescripcion) FormaPrestamoDescripcion
        FROM PersonalPrestamo pre
        LEFT JOIN FormaPrestamo form ON form.FormaPrestamoId = pre.FormaPrestamoId
        LEFT JOIN PersonalPrestamoCuota ppc ON ppc.PersonalPrestamoId = pre.PersonalPrestamoId AND ppc.PersonalId = pre.PersonalId
        WHERE pre.PersonalId = @0 AND ppc.PersonalPrestamoCuotaAno = @1 AND ppc.PersonalPrestamoCuotaMes = @2
        ORDER BY pre.PersonalPrestamoAudFechaIng DESC`,
        [personalId, anio, mes]
      );
      list = list.map((obj: any) => {
        let option = getOptionsPersonalPrestamoAprobado.find((option: any) => {
          return option.value === obj.PersonalPrestamoAprobado
        })
        obj.PersonalPrestamoAprobado = option.label
        return obj
      })

      await queryRunner.commitTransaction()
      return this.jsonRes(list, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async getProxAplicaEl(req: any, res: Response, next: NextFunction) {
    const personalId: number = req.body.personalId
    const tipo: number = req.body.tipo
    const date = new Date()
    const mes = date.getMonth() + 1
    const anio = date.getFullYear()
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction()

      let max: any = await queryRunner.query(
        `SELECT MAX(DATEFROMPARTS(SUBSTRING(pp.PersonalPrestamoAplicaEl,4,4),SUBSTRING(pp.PersonalPrestamoAplicaEl,1,2),1)) aplicaEl
        FROM PersonalPrestamo pp
        WHERE pp.PersonalId = @0 AND pp.FormaPrestamoId = @1
        AND DATEFROMPARTS(SUBSTRING(pp.PersonalPrestamoAplicaEl,4,4),SUBSTRING(pp.PersonalPrestamoAplicaEl,1,2),1) >= DATEFROMPARTS(@2,@3,1)
        `, [personalId, tipo, anio, mes]
      );
      max = max[0].aplicaEl
      // console.log('MAX',max);
      if (max) {
        max.setMonth(max.getMonth() + 1);
      } else {
        max = new Date(anio, mes - 1)
      }
      await queryRunner.commitTransaction()
      return this.jsonRes({ aplicaEl: max }, res, '');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  getNextMonthYear(month: number, year: number): { cuotaMes: number, cuotaAnio: number } {
    if (month < 1 || month > 12) {
      throw new Error("El mes debe estar entre 1 y 12");
    }

    let nextMonth = month + 1;
    let nextYear = year;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    return { cuotaMes: nextMonth, cuotaAnio: nextYear };
  }

  async getGridColumnsCuotas(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columnsAyudaAsistencialCuotas, res)
  }

  async getListAyudaAsistencialCuotas(req: any, res: Response, next: NextFunction) {

    const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
    const filterSql = filtrosToSql(req.body.filters.options.filtros, columnsAyudaAsistencialCuotas);
    const orderBy = orderToSQL(options.sort);
    const anio = req.body.anio
    const mes = req.body.mes
    const queryRunner = dataSource.createQueryRunner();

    try {
      const list = await queryRunner.query(
        `
        SELECT  ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) id 
        , perdes.id perdes_id
        , cuit.PersonalCUITCUILCUIT
        , CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
        , perdes.tipocuenta_id
        , tipdes.DescuentoId
        , tipdes.DescuentoDescripcion
        , perdes.mes
        , perdes.anio
        , perdes.desmovimiento
        , perdes.desmovimiento2
        , perdes.importe
        , perdes.cuotanro
        , perdes.cantcuotas
        , perdes.importetotal
        , perdes.tipoint
        , perdes.FechaAnulacion
        , CONCAT(perdes.anio, '/', perdes.mes) periodo

      FROM VistaPersonalDescuento perdes
      LEFT JOIN Personal per ON per.PersonalId = perdes.PersonalId
      LEFT JOIN Descuento tipdes on tipdes.DescuentoId=perdes.DescuentoId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
      WHERE perdes.anio = @0 AND perdes.mes = @1 AND ( (tipdes.DescuentoId IN (51)) ) AND ${filterSql} ${orderBy}`, [anio, mes]
      )

      this.jsonRes(
        {
          total: list.length,
          list: list,
        },
        res
      );

    } catch (error) {
      return next(error)
    }

  }

}