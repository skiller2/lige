import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { descuentoPorDeudaAnteriorController } from "src/controller/controller.module";

const columnsPersonalDescuentos:any[] = [
  {
    id:'id', name:'Id', field:'id',
    fieldName: 'id',
    type:'string',
    searchType: 'string',
    sortable: true,
    hidden: true,
    searchHidden: true
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'PersonalCUITCUILCUIT', name:'CUIT', field:'PersonalCUITCUILCUIT',
    fieldName:'cuit.PersonalCUITCUILCUIT',
    type:'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id: 'personal', name:'Apellido Nombre', field: 'personal.fullName',
    fieldName: "per.PersonalId",
    sortable: true,
    type: 'string',
    formatter: 'complexObject',
    params: {
        complexFieldLabel: 'personal.fullName',
    },
    searchComponent: "inpurForPersonalSearch",
    searchType: "number",
    // maxWidth: 170,
    // minWidth: 100,
  },
  {
    id:'GrupoActividadId', name:'GrupoActividadId', field:'GrupoActividadId',
    fieldName: 'gap.GrupoActividadId',
    type:'number',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: false
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'tipocuenta_id', name:'Tipo de Cuenta', field:'tipocuenta_id',
    fieldName: 'tipocuenta_id',
    type:'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'tipomov', name:'Tipo Movimiento', field:'tipomov',
    fieldName: '',
    // searchComponent: "",
    type:'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'mes', name:'Mes', field:'mes',
    fieldName: '',
    type:'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'anio', name:'Año', field:'anio',
    fieldName: '',
    type:'number',
    searchType: "number",
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'desmovimiento', name:'Desmovimiento', field:'desmovimiento',
    fieldName: '',
    type:'string',
    searchType: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'tipoint', name:'Tipo', field:'tipoint',
    fieldName: '',
    type:'string',
    searchType: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'importe', name:'Importe', field:'importe',
    fieldName: "",
    type:'float',
    searchType: "float",
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'cuotanro', name:'Num.Cuota', field:'cuotanro',
    fieldName:'cuo.cuotanro',
    type:'number',
    searchType: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'cantcuotas', name:'Cant.Cuotas', field:'cantcuotas',
    fieldName:'des.cantcuotas',
    type:'number',
    searchType: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'importetotal', name:'Importe Total', field:'importetotal',
    fieldName: '',
    type:'float',
    searchType: "float",
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
]

const columnsObjetivosDescuentos:any[] = [
  {
    id:'id', name:'Id', field:'id',
    fieldName: '',
    type:'string',
    searchType: 'string',
    sortable: true,
    hidden: true,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  // {
  //   id:'GrupoActividadId', name:'GrupoActividadId', field:'GrupoActividadId',
  //   fieldName: "gap.GrupoActividadId",
  //   type:'number',
  //   searchType: "number",
  //   sortable: true,
  //   hidden: true,
  //   searchHidden: true,
  //   // minWidth: 50,
  //   // minWidth: 10,
  // },
  {
    id: 'objetivo', name:'Objetivo', field: 'objetivo.descripcion',
    fieldName: "obj.ObjetivoId",
    sortable: true,
    type: 'string',
    formatter: 'complexObject',
    params: {
        complexFieldLabel: 'objetivo.descripcion',
    },
    searchComponent: "inpurForObjetivoSearch",
    searchType: "number",
    // maxWidth: 170,
    // minWidth: 100,
  },
  {
    id:'CUIT', name:'CUIT', field:'CUIT',
    fieldName:'cuit.PersonalCUITCUILCUIT',
    type:'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id: 'personal', name:'Apellido Nombre', field: 'personal.fullName',
    fieldName: "per.PersonalId",
    sortable: true,
    type: 'string',
    formatter: 'complexObject',
    params: {
        complexFieldLabel: 'personal.fullName',
    },
    searchComponent: "inpurForPersonalSearch",
    searchType: "number",
    // maxWidth: 170,
    // minWidth: 100,
  },
  {
    id:'GrupoActividadId', name:'GrupoActividadId', field:'GrupoActividadId',
    fieldName: "gap.GrupoActividadId",
    type:'number',
    searchType: "number",
    sortable: true,
    hidden: true,
    searchHidden: true,
    // minWidth: 50,
    // minWidth: 10,
  },
  {
    id:'tipocuenta_id', name:'Tipo de Cuenta', field:'tipocuenta_id',
    fieldName: 'tipocuenta_id',
    type:'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'tipomov', name:'Tipo Movimiento', field:'tipomov',
    fieldName: '',
    // searchComponent: '',
    type:'number',
    searchType: "number",
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'mes', name:'Mes', field:'mes',
    fieldName: '',
    type:'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'anio', name:'Año', field:'anio',
    fieldName: '',
    type:'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'desmovimiento', name:'Desmovimiento', field:'desmovimiento',
    fieldName: '',
    type:'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'tipoint', name:'Tipo', field:'tipoint',
    fieldName: '',
    type:'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'importe', name:'Importe', field:'importe',
    fieldName: 'cuo.PersonalOtroDescuentoCuotaImporte',
    type:'float',
    searchType: 'float',
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'cuotanro', name:'Num.Cuota', field:'cuotanro',
    fieldName: '',
    type:'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'cantcuotas', name:'Cant.Cuotas', field:'cantcuotas',
    fieldName: '',
    type:'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'importetotal', name:'Importe Total', field:'importetotal',
    fieldName: '',
    type:'float',
    searchType: 'float',
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
]

export class GestionDescuentosController extends BaseController {

  getTimeString(stm: Date) {
    return (stm) ? `${stm.getHours().toString().padStart(2, '0')}:${stm.getMinutes().toString().padStart(2, '0')}:${stm.getSeconds().toString().padStart(2, '0')}`:null
  }

  async getPersonalGridColumns(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columnsPersonalDescuentos, res)
  }

  async getObjetivosGridColumns(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columnsObjetivosDescuentos, res)
  }

  private async getDescuentosPersonalQuery(queryRunner:any, filterSql:any, orderBy:any, anio:number, mes:number) {
    return await queryRunner.query(`
      -- OTROS DESCUENTOS
      SELECT DISTINCT CONCAT('cuo',cuo.PersonalOtroDescuentoCuotaId,'-',cuo.PersonalOtroDescuentoId,'-',cuo.PersonalId,'-',gap.GrupoActividadId) id
      , gap.GrupoActividadId
      --, 0 as ObjetivoId
      , per.PersonalId
      , 'G' as tipocuenta_id
      , cuit.PersonalCUITCUILCUIT
      , CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
      , @1 AS anio
      , @2 AS mes
      , det.DescuentoDescripcion AS tipomov

      , des.PersonalOtroDescuentoDetalle AS desmovimiento
      --, des.PersonalOtroDescuentoDetalle AS desmovimiento2
      , 'OTRO' tipoint
      , cuo.PersonalOtroDescuentoCuotaImporte AS importe
      , cuo.PersonalOtroDescuentoCuotaCuota AS cuotanro
      , des.PersonalOtroDescuentoCantidadCuotas AS cantcuotas
      , des.PersonalOtroDescuentoImporteVariable * des.PersonalOtroDescuentoCantidad AS importetotal

      FROM PersonalOtroDescuentoCuota cuo
      JOIN PersonalOtroDescuento des ON cuo.PersonalOtroDescuentoId = des.PersonalOtroDescuentoId AND cuo.PersonalId = des.PersonalId
      JOIN Descuento det ON det.DescuentoId = des.PersonalOtroDescuentoDescuentoId
      JOIN Personal per ON per.PersonalId = des.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN(SELECT gapx.GrupoActividadPersonalPersonalId, MAX(gapx.GrupoActividadPersonalDesde) GrupoActividadPersonalDesde FROM GrupoActividadPersonal gapx 
        WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gapx.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gapx.GrupoActividadPersonalHasta , '9999-12-31')
        GROUP BY gapx.GrupoActividadPersonalPersonalId) AS gapx ON gapx.GrupoActividadPersonalPersonalId = per.PersonalId
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND gap.GrupoActividadPersonalDesde = gapx.GrupoActividadPersonalDesde

      WHERE cuo.PersonalOtroDescuentoCuotaAno = @1 AND cuo.PersonalOtroDescuentoCuotaMes = @2
      AND (${filterSql})
      ${orderBy}

      UNION ALL

      -- DESCUENTO efecto
      SELECT DISTINCT CONCAT('efe',cuo.PersonalDescuentoCuotaId,'-',cuo.PersonalDescuentoId,'-',cuo.PersonalDescuentoPersonalId,'-',gap.GrupoActividadId) id
      , gap.GrupoActividadId
      --, 0 as ObjetivoId
      , per.PersonalId
      , 'G' as tipocuenta_id
      , cuit.PersonalCUITCUILCUIT
      , CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
      , @1 AS anio
      , @2 AS mes
      , 'Efecto' AS tipomov

      , efe.EfectoDescripcion AS desmovimiento
      --, efe.EfectoDescripcion AS desmovimiento2
      , 'DESC' tipoint
      , cuo.PersonalDescuentoCuotaImporte*des.PersonalDescuentoCantidadEfectos AS importe
      , cuo.PersonalDescuentoCuotaCuota AS cuotanro
      , des.PersonalDescuentoCuotas AS cantcuotas
      , des.PersonalDescuentoImporte - (des.PersonalDescuentoImporte * des.PersonalDescuentoPorcentajeDescuento /100)   AS importetotal

      FROM PersonalDescuento des 
      JOIN PersonalDescuentoCuota cuo ON cuo.PersonalDescuentoId = des.PersonalDescuentoId AND cuo.PersonalDescuentoPersonalId = des.PersonalDescuentoPersonalId
      JOIN Efecto efe ON efe.EfectoId = des.PersonalDescuentoEfectoId
      JOIN Personal per ON per.PersonalId = des.PersonalDescuentoPersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN(SELECT gapx.GrupoActividadPersonalPersonalId, MAX(gapx.GrupoActividadPersonalDesde) GrupoActividadPersonalDesde FROM GrupoActividadPersonal gapx 
        WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gapx.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gapx.GrupoActividadPersonalHasta , '9999-12-31')
        GROUP BY gapx.GrupoActividadPersonalPersonalId) AS gapx ON gapx.GrupoActividadPersonalPersonalId = per.PersonalId
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND gap.GrupoActividadPersonalDesde = gapx.GrupoActividadPersonalDesde

      WHERE cuo.PersonalDescuentoCuotaAno = @1 AND cuo.PersonalDescuentoCuotaMes = @2
      AND (${filterSql})
      ${orderBy}

      UNION ALL

      -- DESCUENTO PREPAGA
      SELECT CONCAT('pre',dis.PersonalPrepagaDescuentoDiscriminadoId,'-',dis.PersonalPrepagaDescuentoId,'-',dis.PersonalId) id
      , gap.GrupoActividadId
      --, 0 as ObjetivoId
      , per.PersonalId
      , 'G' as tipocuenta_id
      , cuit.PersonalCUITCUILCUIT
      , CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
      -- pre.PrepagaDescripcion, pla.PrepagaPlanDescripcion, dis.PersonalPrepagaDescuentoDiscriminadoCUITCUIL,  dis.PersonalPrepagaDescuentoDiscriminadoGravado, dis.PersonalPrepagaDescuentoDiscriminadoExento, dis.PersonalPrepagaDescuentoDiscriminadoTipo,
      , @1 AS anio
      , @2 AS mes
      , 'Prepaga' AS tipomov

      , CONCAT(TRIM(pre.PrepagaDescripcion), ' ', TRIM(pla.PrepagaPlanDescripcion), ' ' ,dis.PersonalPrepagaDescuentoDiscriminadoCUITCUIL, ' ',dis.PersonalPrepagaDescuentoDiscriminadoTipo) AS desmovimiento
      --, CONCAT(TRIM(pre.PrepagaDescripcion), ' ', TRIM(pla.PrepagaPlanDescripcion), ' ' ,dis.PersonalPrepagaDescuentoDiscriminadoCUITCUIL, ' ',dis.PersonalPrepagaDescuentoDiscriminadoTipo) AS desmovimiento2
      , 'PREP' tipoint
      , IIF(dis.PersonalPrepagaDescuentoDiscriminadoTipo='C',(dis.PersonalPrepagaDescuentoDiscriminadoExento+dis.PersonalPrepagaDescuentoDiscriminadoGravado)*-1,(dis.PersonalPrepagaDescuentoDiscriminadoExento+dis.PersonalPrepagaDescuentoDiscriminadoGravado)) AS importe
      , 1 AS cuotanro
      , 1 AS cantcuotas
      , 0 AS importetotal

      FROM PersonalPrepagaDescuento des
      JOIN Prepaga pre ON pre.PrepagaId = des.PrepagaId
      JOIN PrepagaPlan pla ON pla.PrepagaPlanId = des.PrepagaPlanId AND pla.PrepagaId = des.PrepagaId
      JOIN PersonalPrepagaDescuentoDiscriminado dis ON dis.PersonalId = des.PersonalId AND dis.PersonalPrepagaDescuentoId = des.PersonalPrepagaDescuentoId

      JOIN Personal per ON per.PersonalId = des.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN(SELECT gapx.GrupoActividadPersonalPersonalId, MAX(gapx.GrupoActividadPersonalDesde) GrupoActividadPersonalDesde FROM GrupoActividadPersonal gapx 
        WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gapx.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gapx.GrupoActividadPersonalHasta , '9999-12-31')
        GROUP BY gapx.GrupoActividadPersonalPersonalId) AS gapx ON gapx.GrupoActividadPersonalPersonalId = per.PersonalId
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND gap.GrupoActividadPersonalDesde = gapx.GrupoActividadPersonalDesde

      WHERE des.PersonalPrepagaDescuentoPeriodo=CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1)
      AND (${filterSql})
      ${orderBy}
    `, [, anio, mes])
  }

  async getDescuentosPersonal(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const anio = req.body.anio
    const mes = req.body.mes
    try {
      await queryRunner.startTransaction()

      const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
      const filterSql = filtrosToSql(options.filtros, columnsPersonalDescuentos);
      const orderBy = orderToSQL(options.sort)

      const lista: any[] = await this.getDescuentosPersonalQuery(queryRunner, filterSql, orderBy, anio, mes)
      
      for (const descuento of lista) {
        descuento.personal = { id:descuento.PersonalId, fullName:descuento.ApellidoNombre }
        delete descuento.PersonalId;
        delete descuento.ApellidoNombre;
      }
      // console.log('-----------------------------');
      // console.log('lista:', lista.length);

      await queryRunner.commitTransaction()
      this.jsonRes(lista, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async getDescuentosObjetivosQuery(queryRunner:any, filterSql:any, orderBy:any, anio:number, mes:number) {
    return await queryRunner.query(`
      SELECT CONCAT('otr2',cuo.ObjetivoDescuentoCuotaId,'-',cuo.ObjetivoDescuentoId,'-',cuo.ObjetivoId) id
      , gap.GrupoActividadId
      , des.ObjetivoId
      , per.PersonalId
      , IIF(des.ObjetivoId>0,'C','G') tipocuenta_id
      , cuit.PersonalCUITCUILCUIT AS CUIT
      , CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
      , @1 AS anio
      , @2 AS mes
      , det.DescuentoDescripcion AS tipomov
      , CONCAT(des.ObjetivoDescuentoDetalle, ' ', CONCAT(' ', obj.ClienteId,'/', ISNULL(obj.ClienteElementoDependienteId,0), ' ', eledep.ClienteElementoDependienteDescripcion)) AS desmovimiento
      , 'OTRO' tipoint
      , cuo.ObjetivoDescuentoCuotaImporte AS importe
      , cuo.ObjetivoDescuentoCuotaCuota AS cuotanro
      , des.ObjetivoDescuentoCantidadCuotas  AS cantcuotas
      , (des.ObjetivoDescuentoImporteVariable * des.ObjetivoDescuentoCantidad) AS importetotal
      , eledep.ClienteElementoDependienteDescripcion

      FROM ObjetivoDescuentoCuota cuo 
      JOIN ObjetivoDescuento des ON cuo.ObjetivoDescuentoId = des.ObjetivoDescuentoId AND cuo.ObjetivoId = des.ObjetivoId
      LEFT JOIN ObjetivoPersonalJerarquico coo ON coo.ObjetivoId = des.ObjetivoId AND DATEFROMPARTS(@1,@2,28) > coo.ObjetivoPersonalJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(coo.ObjetivoPersonalJerarquicoHasta, '9999-12-31') AND coo.ObjetivoPersonalJerarquicoDescuentos = 1
      JOIN Descuento det ON det.DescuentoId = des.ObjetivoDescuentoDescuentoId
      JOIN Objetivo obj ON obj.ObjetivoId = des.ObjetivoId
      JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
      JOIN Personal per ON per.PersonalId = coo.ObjetivoPersonalJerarquicoPersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN(SELECT gapx.GrupoActividadPersonalPersonalId, MAX(gapx.GrupoActividadPersonalDesde) GrupoActividadPersonalDesde FROM GrupoActividadPersonal gapx 
        WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gapx.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gapx.GrupoActividadPersonalHasta , '9999-12-31')
        GROUP BY gapx.GrupoActividadPersonalPersonalId) AS gapx ON gapx.GrupoActividadPersonalPersonalId = per.PersonalId
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND gap.GrupoActividadPersonalDesde = gapx.GrupoActividadPersonalDesde
      
      WHERE cuo.ObjetivoDescuentoCuotaAno = @1 AND cuo.ObjetivoDescuentoCuotaMes = @2
      AND des.ObjetivoDescuentoDescontarCoordinador = 'S'
      AND (${filterSql})
      ${orderBy}
    `, [, anio, mes])
  }

  async getDescuentosObjetivos(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const anio = req.body.anio
    const mes = req.body.mes
    try {
      await queryRunner.startTransaction()

      const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
      const filterSql = filtrosToSql(options.filtros, columnsObjetivosDescuentos);
      const orderBy = orderToSQL(options.sort)

      const lista: any[] = await this.getDescuentosObjetivosQuery(queryRunner, filterSql, orderBy, anio, mes)
      for (const descuento of lista) {
        descuento.personal = { id:descuento.PersonalId, fullName:descuento.ApellidoNombre }
        descuento.objetivo = { id:descuento.ObjetivoId, descripcion:descuento.ClienteElementoDependienteDescripcion }
        delete descuento.PersonalId;
        delete descuento.ApellidoNombre;
        delete descuento.ObjetivoId;
        delete descuento.ClienteElementoDependienteDescripcion;
      }
      // console.log('-----------------------------');
      // console.log('lista:', lista.length);
      
      await queryRunner.commitTransaction()
      this.jsonRes(lista, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async getTiposDescuentosQuery(queryRunner: any) {
      return await queryRunner.query(`
          SELECT DescuentoId value, TRIM(DescuentoDescripcion) label
          FROM Descuento`)
    }
  
  async getTiposDescuentos(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await this.getTiposDescuentosQuery(queryRunner)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  async getDescuentosByPersonalId(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const PersonalId: number = req.body.PersonalId
    const anio: number = req.body.anio
    const mes: number = req.body.mes
    try {
      const descuentos = await queryRunner.query(`
      -- OTROS DESCUENTOS
      SELECT DISTINCT 
      'G' as tipocuenta_id
      , @1 AS anio
      , @2 AS mes
      , det.DescuentoDescripcion AS tipomov
      , des.PersonalOtroDescuentoDetalle AS desmovimiento
      , 'OTRO' tipoint
      , cuo.PersonalOtroDescuentoCuotaImporte AS importe
      , cuo.PersonalOtroDescuentoCuotaCuota AS cuotanro
      , des.PersonalOtroDescuentoCantidadCuotas AS cantcuotas
      , des.PersonalOtroDescuentoImporteVariable * des.PersonalOtroDescuentoCantidad AS importetotal

      FROM PersonalOtroDescuentoCuota cuo
      JOIN PersonalOtroDescuento des ON cuo.PersonalOtroDescuentoId = des.PersonalOtroDescuentoId AND cuo.PersonalId = des.PersonalId
      JOIN Descuento det ON det.DescuentoId = des.PersonalOtroDescuentoDescuentoId
      JOIN Personal per ON per.PersonalId = des.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN(SELECT gapx.GrupoActividadPersonalPersonalId, MAX(gapx.GrupoActividadPersonalDesde) GrupoActividadPersonalDesde FROM GrupoActividadPersonal gapx 
        WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gapx.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gapx.GrupoActividadPersonalHasta , '9999-12-31')
        GROUP BY gapx.GrupoActividadPersonalPersonalId) AS gapx ON gapx.GrupoActividadPersonalPersonalId = per.PersonalId
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND gap.GrupoActividadPersonalDesde = gapx.GrupoActividadPersonalDesde

      WHERE cuo.PersonalOtroDescuentoCuotaAno = @1 AND cuo.PersonalOtroDescuentoCuotaMes = @2 AND per.PersonalId IN (@0)

      UNION ALL

      -- DESCUENTO EFECTO
      SELECT DISTINCT
      'G' as tipocuenta_id
      , @1 AS anio
      , @2 AS mes
      , 'Efecto' AS tipomov

      , efe.EfectoDescripcion AS desmovimiento
      , 'DESC' tipoint
      , cuo.PersonalDescuentoCuotaImporte*des.PersonalDescuentoCantidadEfectos AS importe
      , cuo.PersonalDescuentoCuotaCuota AS cuotanro
      , des.PersonalDescuentoCuotas AS cantcuotas
      , des.PersonalDescuentoImporte - (des.PersonalDescuentoImporte * des.PersonalDescuentoPorcentajeDescuento /100)   AS importetotal

      FROM PersonalDescuento des 
      JOIN PersonalDescuentoCuota cuo ON cuo.PersonalDescuentoId = des.PersonalDescuentoId AND cuo.PersonalDescuentoPersonalId = des.PersonalDescuentoPersonalId
      JOIN Efecto efe ON efe.EfectoId = des.PersonalDescuentoEfectoId
      JOIN Personal per ON per.PersonalId = des.PersonalDescuentoPersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN(SELECT gapx.GrupoActividadPersonalPersonalId, MAX(gapx.GrupoActividadPersonalDesde) GrupoActividadPersonalDesde FROM GrupoActividadPersonal gapx 
        WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gapx.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gapx.GrupoActividadPersonalHasta , '9999-12-31')
        GROUP BY gapx.GrupoActividadPersonalPersonalId) AS gapx ON gapx.GrupoActividadPersonalPersonalId = per.PersonalId
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND gap.GrupoActividadPersonalDesde = gapx.GrupoActividadPersonalDesde

      WHERE cuo.PersonalDescuentoCuotaAno = @1 AND cuo.PersonalDescuentoCuotaMes = @2 AND per.PersonalId IN (@0)

      UNION ALL

      -- DESCUENTO PREPAGA
      SELECT 
      'G' as tipocuenta_id
      , @1 AS anio
      , @2 AS mes
      , 'Prepaga' AS tipomov
      , CONCAT(TRIM(pre.PrepagaDescripcion), ' ', TRIM(pla.PrepagaPlanDescripcion), ' ' ,dis.PersonalPrepagaDescuentoDiscriminadoCUITCUIL, ' ',dis.PersonalPrepagaDescuentoDiscriminadoTipo) AS desmovimiento
      , 'PREP' tipoint
      , IIF(dis.PersonalPrepagaDescuentoDiscriminadoTipo='C',(dis.PersonalPrepagaDescuentoDiscriminadoExento+dis.PersonalPrepagaDescuentoDiscriminadoGravado)*-1,(dis.PersonalPrepagaDescuentoDiscriminadoExento+dis.PersonalPrepagaDescuentoDiscriminadoGravado)) AS importe
      , 1 AS cuotanro
      , 1 AS cantcuotas
      , 0 AS importetotal

      FROM PersonalPrepagaDescuento des
      JOIN Prepaga pre ON pre.PrepagaId = des.PrepagaId
      JOIN PrepagaPlan pla ON pla.PrepagaPlanId = des.PrepagaPlanId AND pla.PrepagaId = des.PrepagaId
      JOIN PersonalPrepagaDescuentoDiscriminado dis ON dis.PersonalId = des.PersonalId AND dis.PersonalPrepagaDescuentoId = des.PersonalPrepagaDescuentoId

      JOIN Personal per ON per.PersonalId = des.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN(SELECT gapx.GrupoActividadPersonalPersonalId, MAX(gapx.GrupoActividadPersonalDesde) GrupoActividadPersonalDesde FROM GrupoActividadPersonal gapx 
        WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gapx.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gapx.GrupoActividadPersonalHasta , '9999-12-31')
        GROUP BY gapx.GrupoActividadPersonalPersonalId) AS gapx ON gapx.GrupoActividadPersonalPersonalId = per.PersonalId
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND gap.GrupoActividadPersonalDesde = gapx.GrupoActividadPersonalDesde

      WHERE des.PersonalPrepagaDescuentoPeriodo=CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1) AND per.PersonalId IN (@0)
      `, [ PersonalId, anio, mes])
      // console.log('descuentos: ', descuentos.length);
        
      this.jsonRes(descuentos, res);
    } catch (error) {
      return next(error)
    }
  }

  private async addPersonalOtroDescuento(queryRunner:any, otroDescuento:any, usuarioId:number, ip:string){
    const DescuentoId:number = otroDescuento.DescuentoId
    const PersonalId:number = otroDescuento.PersonalId
    const AplicaEl:Date = otroDescuento.AplicaEl? new Date(otroDescuento.AplicaEl) : null
    // AplicaEl.setHours(0, 0, 0, 0)
    const Cuotas:number = otroDescuento.Cuotas
    const Importe:number = otroDescuento.Importe
    const Detalle:number = otroDescuento.Detalle

    const anio:number = AplicaEl.getFullYear()
    const mes:number = AplicaEl.getMonth()+1

    let PersonalOtroDescuento = await queryRunner.query(`
      SELECT PersonalOtroDescuentoId, PersonalId, PersonalOtroDescuentoDescuentoId, PersonalOtroDescuentoAnoAplica, PersonalOtroDescuentoMesesAplica
      FROM PersonalOtroDescuento
      WHERE PersonalId IN (@0) AND PersonalOtroDescuentoDescuentoId IN (@1) AND PersonalOtroDescuentoAnoAplica IN (@2) AND PersonalOtroDescuentoMesesAplica IN (@3)
    `, [PersonalId, DescuentoId, anio, mes])
    if (PersonalOtroDescuento.length) {
      throw new ClientException(`Ya existe un registro del mismo Tipo para el periodo ${mes}/${anio} de la persona.`)
    }
    
    const Personal = await queryRunner.query(`SELECT ISNULL(PersonalOtroDescuentoUltNro, 0) AS PersonalOtroDescuentoUltNro FROM Personal WHERE PersonalId IN (@0)`, [PersonalId])
    const PersonalOtroDescuentoId = Personal[0].PersonalOtroDescuentoUltNro+1
    const hoy = new Date()
    const hora = this.getTimeString(hoy)
    await queryRunner.query(`
      INSERT INTO PersonalOtroDescuento (
      PersonalOtroDescuentoId, PersonalId, PersonalOtroDescuentoDescuentoId, PersonalOtroDescuentoAnoAplica
      , PersonalOtroDescuentoMesesAplica, PersonalOtroDescuentoMes, PersonalOtroDescuentoCantidad, PersonalOtroDescuentoCantidadCuotas
      , PersonalOtroDescuentoImporteVariable, PersonalOtroDescuentoFechaAplica, PersonalOtroDescuentoCuotasPagas
      , PersonalOtroDescuentoLiquidoFinanzas, PersonalOtroDescuentoCuotaUltNro, PersonalOtroDescuentoUltimaLiquidacion, PersonalOtroDescuentoDetalle
      , PersonalOtroDescuentoPuesto, PersonalOtroDescuentoUsuarioId, PersonalOtroDescuentoDia, PersonalOtroDescuentoTiempo)
      VALUES (@0, @1, @2, @3, @4, @4, 1, @5, @6, @7, 0, 1, 1, CONCAT(FORMAT(@4,'00'),'/',@3,' Cuota 1'), @8, @9, @10, @11, @12)

      INSERT INTO PersonalOtroDescuentoCuota (
        PersonalOtroDescuentoCuotaId, PersonalOtroDescuentoId, PersonalId,
        PersonalOtroDescuentoCuotaAno, PersonalOtroDescuentoCuotaMes, PersonalOtroDescuentoCuotaCuota,
        PersonalOtroDescuentoCuotaImporte, PersonalOtroDescuentoCuotaMantiene, PersonalOtroDescuentoCuotaFinalizado,
        PersonalOtroDescuentoCuotaProceso)
        VALUES (1,@0,@1,@3,@4,1,ROUND(@6/@5, 2),0,0,'FA')
      `, [PersonalOtroDescuentoId, PersonalId, DescuentoId, anio, mes, Cuotas, Importe, AplicaEl, Detalle, ip, usuarioId, hoy, hora])
    
    await queryRunner.query(`UPDATE Personal SET PersonalOtroDescuentoUltNro = @1 WHERE PersonalId IN (@0)`, [PersonalId, PersonalOtroDescuentoId])
    return PersonalOtroDescuentoId
  }

  private async addObjetivoDescuento(queryRunner:any, objDescuento:any, usuarioId:number, ip:string){
    const DescuentoId:number = objDescuento.DescuentoId
    const ObjetivoId:number = objDescuento.ObjetivoId
    const AplicaEl:Date = objDescuento.AplicaEl? new Date(objDescuento.AplicaEl) : null
    // AplicaEl.setHours(0, 0, 0, 0)
    const Cuotas:number = objDescuento.Cuotas
    const Importe:number = objDescuento.Importe
    const Detalle:number = objDescuento.Detalle

    const anio:number = AplicaEl.getFullYear()
    const mes:number = AplicaEl.getMonth()+1

    let ObjetivoDescuento = await queryRunner.query(`
      SELECT ObjetivoDescuentoId, ObjetivoId, ObjetivoDescuentoDescuentoId, ObjetivoDescuentoAnoAplica, ObjetivoDescuentoMesesAplica
      FROM ObjetivoDescuento
      WHERE ObjetivoId IN (@0) AND ObjetivoDescuentoDescuentoId IN (@1) AND ObjetivoDescuentoAnoAplica IN (@2) AND ObjetivoDescuentoMesesAplica IN (@3)
    `, [ObjetivoId, DescuentoId, anio, mes])
    if (ObjetivoDescuento.length) {
      throw new ClientException(`Ya existe un registro del mismo Tipo para el periodo ${mes}/${anio} del objetivo.`)
    }
    
    const Objetivo = await queryRunner.query(`SELECT ISNULL(ObjetivoDescuentoUltNro, 0) AS ObjetivoDescuentoUltNro FROM Objetivo WHERE ObjetivoId IN (@0)`, [ObjetivoId])
    const ObjetivoDescuentoId = Objetivo[0].ObjetivoDescuentoUltNro+1
    const hoy = new Date()
    const hora = this.getTimeString(hoy)
    await queryRunner.query(`
      INSERT INTO ObjetivoDescuento (
      ObjetivoDescuentoId, ObjetivoId, ObjetivoDescuentoDescuentoId, ObjetivoDescuentoAnoAplica
      , ObjetivoDescuentoMesesAplica, ObjetivoDescuentoMes, ObjetivoDescuentoCantidad, ObjetivoDescuentoCantidadCuotas
      , ObjetivoDescuentoImporteVariable, ObjetivoDescuentoFechaAplica, ObjetivoDescuentoCuotasPagas
      , ObjetivoDescuentoLiquidoFinanzas, ObjetivoDescuentoCuotaUltNro, ObjetivoDescuentoDetalle
      , ObjetivoDescuentoPuesto, ObjetivoDescuentoUsuarioId, ObjetivoDescuentoDia, ObjetivoDescuentoTiempo)
      VALUES (@0, @1, @2, @3, @4, @4, 1, @5, @6, @7, 0, 0, 0, @8, @9, @10, @11, @12)

      INSERT ObjetivoDescuentoCuota (ObjetivoDescuentoCuotaId, ObjetivoDescuentoId, ObjetivoId,
        ObjetivoDescuentoCuotaAno, ObjetivoDescuentoCuotaMes, ObjetivoDescuentoCuotaCuota,
        ObjetivoDescuentoCuotaImporte, ObjetivoDescuentoCuotaMantiene, ObjetivoDescuentoCuotaFinalizado,
        ObjetivoDescuentoCuotaProceso)
        VALUES (1,@0,@1,@3,@4,1,ROUND(@6/@5, 2),0,0,'FA')
    `, [ObjetivoDescuentoId, ObjetivoId, DescuentoId, anio, mes, Cuotas, Importe, AplicaEl, Detalle, ip, usuarioId, hoy, hora])

    await queryRunner.query(`UPDATE Objetivo SET ObjetivoDescuentoUltNro = @1 WHERE ObjetivoId IN (@0)`, [ObjetivoId, ObjetivoDescuentoId])
    return ObjetivoDescuentoId
  }

  async addDescuento(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const PersonalId = req.body.PersonalId
    const ObjetivoId = req.body.ObjetivoId
    let id:number = 0
    try {
      await queryRunner.startTransaction()
      const usuarioId = await this.getUsuarioId(res, queryRunner)
      const ip = this.getRemoteAddress(req)

      //Valida que el período no tenga el indicador de recibos generado
      const AplicaEl:Date = new Date(req.body.AplicaEl)
      const anio = AplicaEl.getFullYear()
      const mes = AplicaEl.getMonth()+1
      const checkrecibos = await this.getPeriodoQuery(queryRunner, anio, mes)
      if (checkrecibos[0]?.ind_recibos_generados == 1)
        throw new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}, no se puede hacer modificaciones`)


      if (PersonalId && !ObjetivoId) {
        id = await this.addPersonalOtroDescuento(queryRunner, req.body, usuarioId, ip)
      }else if (ObjetivoId && !PersonalId) {
        id = await this.addObjetivoDescuento(queryRunner, req.body, usuarioId, ip)
      }else {
        throw new ClientException('Debe de ingresar solo una Objetivo o Personal')
      }

      await queryRunner.commitTransaction()
      this.jsonRes({ id }, res, 'Carga Exitosa');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async getPeriodoQuery(queryRunner:any, anio:number, mes:number){
    return await queryRunner.query(`
      SELECT periodo_id, anio, mes, ind_recibos_generados
      FROM lige.dbo.liqmaperiodo
      WHERE anio = @1 AND mes = @2
      `, [, anio, mes])
  }

  async addDescuentoCuotas(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const anio : number = req.body.year
    const mes : number = req.body.month
    let errors : string[] = []
    try {
      await queryRunner.startTransaction()
      const per = await this.getPeriodoQuery(queryRunner, anio, mes)
      if (per[0] && per[0].ind_recibos_generados == 1)
        throw new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}.`)
      const listOtroDescuento = await this.otroDescuentoListAddCuotaQuery(queryRunner, anio, mes)
      
      //PersonalOtrosDescuentos
      for (const obj of listOtroDescuento) {
        await this.personalOtroDescuentoAddCuota(
          queryRunner, {...obj, anio, mes}
        )
      }
      
      //ObjetivoDescuentos
      const listObjetivoDescuento = await this.objetivoDescuentoListAddCuotaQuery(queryRunner, anio, mes)
      
      for (const obj of listObjetivoDescuento) {
        await this.objetivoDescuentoAddCuota(
          queryRunner, {...obj, anio, mes}
        )
      }

      // throw new ClientException(`DEBUG.`)
      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, 'Carga Exitosa');
    }catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async otroDescuentoListAddCuotaQuery(
    queryRunner:any, anio:number, mes:number
  ){
    return await queryRunner.query(`
      SELECT otro.PersonalOtroDescuentoId, otro.PersonalId, podcx.PersonalOtroDescuentoCuotaId,
      otro.PersonalOtroDescuentoCantidadCuotas, 
      otro.PersonalOtroDescuentoCuotasPagas,
      otro.PersonalOtroDescuentoImporteVariable,
      CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
      ISNULL(otro.PersonalOtroDescuentoCuotaUltNro, 0) AS PersonalOtroDescuentoCuotaUltNro,
      ROUND(PersonalOtroDescuentoImporteVariable/PersonalOtroDescuentoCantidadCuotas, 2) AS PersonalOtroDescuentoCuotaImporte,
      fin.PersonalOtroDescuentoCuotaFinalizado
      FROM PersonalOtroDescuento otro
      JOIN Personal per ON per.PersonalId = otro.PersonalId 
      LEFT JOIN (SELECT DISTINCT podc.PersonalId, podc.PersonalOtroDescuentoId, podc.PersonalOtroDescuentoCuotaFinalizado FROM PersonalOtroDescuentoCuota podc WHERE podc.PersonalOtroDescuentoCuotaFinalizado = 1 AND podc.PersonalOtroDescuentoCuotaAno*100+podc.PersonalOtroDescuentoCuotaMes <= @1*100+@2) fin ON fin.PersonalId = otro.PersonalId AND fin.PersonalOtroDescuentoId = otro.PersonalOtroDescuentoId
      LEFT JOIN PersonalOtroDescuentoCuota podcx ON podcx.PersonalId = otro.PersonalId AND podcx.PersonalOtroDescuentoId = otro.PersonalOtroDescuentoId AND podcx.PersonalOtroDescuentoCuotaAno = @1 AND podcx.PersonalOtroDescuentoCuotaMes =@2
		
		  WHERE otro.PersonalOtroDescuentoCantidadCuotas > otro.PersonalOtroDescuentoCuotasPagas
      AND DATEFROMPARTS(otro.PersonalOtroDescuentoAnoAplica, otro.PersonalOtroDescuentoMesesAplica, 1) >= DATEFROMPARTS(@1,@2,1)
      AND fin.PersonalOtroDescuentoId IS NULL
      AND ISNULL(podcx.PersonalOtroDescuentoCuotaImporte,0) != ROUND(PersonalOtroDescuentoImporteVariable/PersonalOtroDescuentoCantidadCuotas, 2)
    `, [ 0, anio, mes])
  }

  async personalOtroDescuentoAddCuota(
    queryRunner: any, descuento:any
  ) {
    const personalOtroDescuentoId:number = descuento.PersonalOtroDescuentoId
    const personalOtroDescuentoCuotaId:number = descuento.PersonalOtroDescuentoCuotaId
    const personalId:number = descuento.PersonalId
    const anio:number = descuento.anio
    const mes:number = descuento.mes
    const importeCuota:number = descuento.importeCuota
    const apellidoNombre:string = descuento.ApellidoNombre
    const finalizado:boolean = descuento.PersonalOtroDescuentoCuotaFinalizado
    let ultCuota:number = descuento.PersonalOtroDescuentoCuotaUltNro
    
    if (personalOtroDescuentoCuotaId && !finalizado) {
      await queryRunner.query(`
        UPDATE PersonalOtroDescuentoCuota
        SET PersonalOtroDescuentoCuotaImporte = @3
        WHERE PersonalOtroDescuentoId = @0 AND PersonalId = @1 AND PersonalOtroDescuentoCuotaId = @2
      `, [personalOtroDescuentoId, personalId, personalOtroDescuentoCuotaId, importeCuota]
      )
    }else if (!personalOtroDescuentoCuotaId) {
      ultCuota++
      await queryRunner.query(`
        INSERT PersonalOtroDescuentoCuota (PersonalOtroDescuentoCuotaId, PersonalOtroDescuentoId, PersonalId,
        PersonalOtroDescuentoCuotaAno, PersonalOtroDescuentoCuotaMes, PersonalOtroDescuentoCuotaCuota,
        PersonalOtroDescuentoCuotaImporte, PersonalOtroDescuentoCuotaMantiene, PersonalOtroDescuentoCuotaFinalizado,
        PersonalOtroDescuentoCuotaProceso)
        VALUES (@0,@1,@2,@3,@4,@0,@5,0,0,@6)
      `,[ultCuota, personalOtroDescuentoId, personalId, anio, mes, importeCuota, 'FA'])
  
      await queryRunner.query(`
        UPDATE PersonalOtroDescuento
        SET PersonalOtroDescuentoUltimaLiquidacion = CONCAT(FORMAT(@2,'00'),'/',@3,' Cuota ', @4), PersonalOtroDescuentoCuotaUltNro = @4,
        PersonalOtroDescuentoCuotasPagas = @4
        WHERE PersonalOtroDescuentoId = @0 AND PersonalId = @1
      `, [personalOtroDescuentoId, personalId, mes, anio, ultCuota]
      )
    }

    
  }

  async objetivoDescuentoListAddCuotaQuery(
    queryRunner:any, anio:number, mes:number
  ){
    return await queryRunner.query(`
      SELECT objdes.ObjetivoDescuentoId, objdes.ObjetivoId, odcx.ObjetivoDescuentoCuotaId,
      objdes.ObjetivoDescuentoCantidadCuotas,
      objdes.ObjetivoDescuentoCuotasPagas,
      objdes.ObjetivoDescuentoImporteVariable,
      TRIM(eledep.ClienteElementoDependienteDescripcion) AS ClienteElementoDependienteDescripcion,
      ISNULL(objdes.ObjetivoDescuentoCuotaUltNro, 0) AS ObjetivoDescuentoCuotaUltNro,
      ROUND(objdes.ObjetivoDescuentoImporteVariable / objdes.ObjetivoDescuentoCantidadCuotas, 2) AS ObjetivoDescuentoCuotaImporte,
      fin.ObjetivoDescuentoCuotaFinalizado
      FROM ObjetivoDescuento objdes
      JOIN Objetivo obj ON obj.ObjetivoId = objdes.ObjetivoId
      JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
      LEFT JOIN (SELECT DISTINCT odc.ObjetivoId, odc.ObjetivoDescuentoId, odc.ObjetivoDescuentoCuotaFinalizado FROM ObjetivoDescuentoCuota odc WHERE odc.ObjetivoDescuentoCuotaFinalizado = 1 AND odc.ObjetivoDescuentoCuotaAno*100+odc.ObjetivoDescuentoCuotaMes <= @1*100+@2) fin ON fin.ObjetivoId = objdes.ObjetivoId AND fin.ObjetivoDescuentoId = objdes.ObjetivoDescuentoId
      LEFT JOIN ObjetivoDescuentoCuota odcx ON odcx.ObjetivoId = objdes.ObjetivoId AND odcx.ObjetivoDescuentoId = objdes.ObjetivoDescuentoId AND odcx.ObjetivoDescuentoCuotaAno = @1 AND odcx.ObjetivoDescuentoCuotaMes =@2
		
      WHERE objdes.ObjetivoDescuentoCantidadCuotas > objdes.ObjetivoDescuentoCuotasPagas
      AND DATEFROMPARTS(objdes.ObjetivoDescuentoAnoAplica, objdes.ObjetivoDescuentoMesesAplica, 1) >= DATEFROMPARTS(@1,@2,1)
      AND fin.ObjetivoDescuentoId IS NULL
      AND ISNULL(odcx.ObjetivoDescuentoCuotaImporte,0) != ROUND(objdes.ObjetivoDescuentoImporteVariable / objdes.ObjetivoDescuentoCantidadCuotas, 2)
      `, [ 0, anio, mes])
  }

  async objetivoDescuentoAddCuota(
    queryRunner:any, descuento:any,
  ) {
    const objetivoDescuentoId:number = descuento.ObjetivoDescuentoId
    const objetivoDescuentoCuotaId:number = descuento.ObjetivoDescuentoCuotaId
    const objetivoId:number = descuento.ObjetivoId
    const anio:number = descuento.anio
    const mes:number = descuento.mes
    const importeCuota:number = descuento.importeCuota
    const objDescripcion:string = descuento.ClienteElementoDependienteDescripcion
    const finalizado:boolean = descuento.ObjetivoDescuentoCuotaFinalizado
    let ultCuota:number = descuento.ObjetivoDescuentoCuotaUltNro
    if (objetivoDescuentoCuotaId && !finalizado) {
      await queryRunner.query(`
        UPDATE ObjetivoDescuentoCuota
        SET ObjetivoDescuentoCuotaImporte = @3
        WHERE ObjetivoDescuentoId = @0 AND ObjetivoId = @1 AND ObjetivoDescuentoCuotaId = @2
      `, [objetivoDescuentoId, objetivoId, objetivoDescuentoCuotaId, importeCuota]
      )
    }else if (!objetivoDescuentoCuotaId) {
      ultCuota++
      await queryRunner.query(`
        INSERT ObjetivoDescuentoCuota (ObjetivoDescuentoCuotaId, ObjetivoDescuentoId, ObjetivoId,
        ObjetivoDescuentoCuotaAno, ObjetivoDescuentoCuotaMes, ObjetivoDescuentoCuotaCuota,
        ObjetivoDescuentoCuotaImporte, ObjetivoDescuentoCuotaMantiene, ObjetivoDescuentoCuotaFinalizado,
        ObjetivoDescuentoCuotaProceso)
        VALUES (@0,@1,@2,@3,@4,@0,@5,0,0,@6)
      `,[ultCuota, objetivoDescuentoId, objetivoId, anio, mes, importeCuota, 'FA'])

      await queryRunner.query(`
        UPDATE ObjetivoDescuento
        SET ObjetivoDescuentoCuotaUltNro = @3, ObjetivoDescuentoCuotasPagas = @3
        WHERE ObjetivoDescuentoId = @0 AND ObjetivoId = @1
      `, [objetivoDescuentoId, objetivoId, ultCuota]
      ) 
    }  
    return
  }

  async updateDescuento(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const PersonalId = req.body.PersonalId
    const ObjetivoId = req.body.ObjetivoId
    let errors : string[] = []
    try {
      await queryRunner.startTransaction()
      const usuarioId = await this.getUsuarioId(res, queryRunner)
      const ip = this.getRemoteAddress(req)
      
      const AplicaEl:Date = new Date(req.body.AplicaEl)
      const anio = AplicaEl.getFullYear()
      const mes = AplicaEl.getMonth()+1
      const checkrecibos = await this.getPeriodoQuery(queryRunner, anio, mes)
      if (checkrecibos[0]?.ind_recibos_generados == 1)
        throw new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}, no se puede hacer modificaciones`)
     
      if (PersonalId && !ObjetivoId) { //PersonalOtrosDescuentos
        await this.updatePersonalOtroDescuento(queryRunner, req.body, usuarioId, ip)
      } else if (ObjetivoId && !PersonalId) { //ObjetivoDescuentos
        await this.updateObjetivoDescuento(queryRunner, req.body, usuarioId, ip)
      }  else {
        throw new ClientException(`Error de busqueda.`)
      }

      // throw new ClientException(`DEBUG.`)
      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, 'Carga Exitosa');
    }catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async updatePersonalOtroDescuento(queryRunner:any, otroDescuento:any, usuarioId:number, ip:string){
    const id:number = otroDescuento.id
    const DescuentoId:number = otroDescuento.DescuentoId
    const PersonalId:number = otroDescuento.PersonalId
    const AplicaEl:Date = otroDescuento.AplicaEl? new Date(otroDescuento.AplicaEl) : null
    const Cuotas:number = otroDescuento.Cuotas
    const Importe:number = otroDescuento.Importe
    const Detalle:number = otroDescuento.Detalle

    const anio:number = AplicaEl.getFullYear()
    const mes:number = AplicaEl.getMonth()+1

    let res = await queryRunner.query(`
      SELECT PersonalOtroDescuentoDescuentoId DescuentoId, PersonalOtroDescuentoFechaAplica AplicaEl
      , PersonalOtroDescuentoAnoAplica AnoAplica, PersonalOtroDescuentoMesesAplica MesesAplica
      , PersonalOtroDescuentoCantidadCuotas Cuotas, PersonalOtroDescuentoImporteVariable Importe
      , PersonalOtroDescuentoDetalle Detalle, PersonalOtroDescuentoCuotaUltNro CuotaUltNro
      FROM PersonalOtroDescuento
      WHERE PersonalOtroDescuentoId IN (@0) AND PersonalId IN (@1)
    `, [id, PersonalId])
    if (!res.length) {
      throw new ClientException(`No se encontro el descuento de la persona.`)
    }
    // const PersonalOtroDescuento = res[0]
    // const checkrecibos = await this.getPeriodoQuery(queryRunner, PersonalOtroDescuento.AnoAplica, PersonalOtroDescuento.MesesAplica)
    // if (checkrecibos[0]?.ind_recibos_generados == 1)
    //   throw new ClientException(`No se puede modificar descuentos de periodos ya cerrados.`)

    const hoy:Date = new Date()
    const hora = this.getTimeString(hoy)
    hoy.setHours(0, 0, 0, 0)
    await queryRunner.query(`
      UPDATE PersonalOtroDescuento SET
      PersonalOtroDescuentoDescuentoId = @2, PersonalOtroDescuentoAnoAplica = @3
      , PersonalOtroDescuentoMesesAplica = @4, PersonalOtroDescuentoMes = @4
      , PersonalOtroDescuentoCantidadCuotas= @5, PersonalOtroDescuentoImporteVariable = @6
      , PersonalOtroDescuentoFechaAplica = @7, PersonalOtroDescuentoDetalle = @8
      , PersonalOtroDescuentoPuesto = @9, PersonalOtroDescuentoUsuarioId = @10
      , PersonalOtroDescuentoDia = @11, PersonalOtroDescuentoTiempo = @12
      WHERE PersonalOtroDescuentoId IN (@0) AND PersonalId IN (@1)
      `, [id, PersonalId, DescuentoId, anio, mes, Cuotas, Importe, AplicaEl, Detalle, ip, usuarioId, hoy, hora])
    
    await queryRunner.query(`
      UPDATE PersonalOtroDescuentoCuota SET
      PersonalOtroDescuentoCuotaImporte = ROUND(@3/@2, 2)
      WHERE PersonalOtroDescuentoId IN (@0) AND PersonalId IN (@1)
      `, [id, PersonalId, Cuotas, Importe])
  }

  private async updateObjetivoDescuento(queryRunner:any, otroDescuento:any, usuarioId:number, ip:string){
    const id:number = otroDescuento.id
    const DescuentoId:number = otroDescuento.DescuentoId
    const ObjetivoId:number = otroDescuento.ObjetivoId
    const AplicaEl:Date = otroDescuento.AplicaEl? new Date(otroDescuento.AplicaEl) : null
    const Cuotas:number = otroDescuento.Cuotas
    const Importe:number = otroDescuento.Importe
    const Detalle:number = otroDescuento.Detalle

    const anio:number = AplicaEl.getFullYear()
    const mes:number = AplicaEl.getMonth()+1

    let res = await queryRunner.query(`
      SELECT ObjetivoDescuentoDescuentoId DescuentoId, ObjetivoDescuentoFechaAplica AplicaEl
      , ObjetivoDescuentoAnoAplica AnoAplica, ObjetivoDescuentoMesesAplica MesesAplica
      , ObjetivoDescuentoCantidadCuotas Cuotas, ObjetivoDescuentoImporteVariable Importe
      , ObjetivoDescuentoDetalle Detalle, ObjetivoDescuentoCuotaUltNro CuotaUltNro
      FROM ObjetivoDescuento
      WHERE ObjetivoDescuentoId IN (@0) AND ObjetivoId IN (@1)
    `, [id, ObjetivoId])
    if (!res.length) {
      throw new ClientException(`No se encontro el descuento del objetivo.`)
    }
    // const ObjetivoDescuento = res[0]
    // const checkrecibos = await this.getPeriodoQuery(queryRunner, PersonalOtroDescuento.AnoAplica, PersonalOtroDescuento.MesesAplica)
    // if (checkrecibos[0]?.ind_recibos_generados == 1)
    //   throw new ClientException(`No se puede modificar descuentos de periodos ya cerrados.`)

    const hoy:Date = new Date()
    const hora = this.getTimeString(hoy)
    hoy.setHours(0, 0, 0, 0)
    await queryRunner.query(`
      UPDATE ObjetivoDescuento SET
      ObjetivoDescuentoDescuentoId = @2, ObjetivoDescuentoAnoAplica = @3
      , ObjetivoDescuentoMesesAplica = @4, ObjetivoDescuentoMes = @4
      , ObjetivoDescuentoCantidadCuotas= @5, ObjetivoDescuentoImporteVariable = @6
      , ObjetivoDescuentoFechaAplica = @7, ObjetivoDescuentoDetalle = @8
      , ObjetivoDescuentoPuesto = @9, ObjetivoDescuentoUsuarioId = @10
      , ObjetivoDescuentoDia = @11, ObjetivoDescuentoTiempo = @12
      WHERE ObjetivoDescuentoId IN (@0) AND ObjetivoId IN (@1)
      `, [id, ObjetivoId, DescuentoId, anio, mes, Cuotas, Importe, AplicaEl, Detalle, ip, usuarioId, hoy, hora])
    
    await queryRunner.query(`
      UPDATE ObjetivoDescuentoCuota SET
      ObjetivoDescuentoCuotaImporte = ROUND(@3/@2, 2)
      WHERE ObjetivoDescuentoId IN (@0) AND ObjetivoId IN (@1)
      `, [id, ObjetivoId, Cuotas, Importe])
  }

  async cancellationPersonalOtroDescuento(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const id = Number(req.body.id)
    const PersonalId = Number(req.body.PersonalId)
    let errors : string[] = []
    try {
      await queryRunner.startTransaction()
      const usuarioId = await this.getUsuarioId(res, queryRunner)
      const ip = this.getRemoteAddress(req)
      
      if (PersonalId) { //PersonalOtrosDescuentos
        await this.cancellationPersonalOtroDescuentoQuery(queryRunner, id, PersonalId)
      } else {
        throw new ClientException(`Error de busqueda.`)
      }

      // throw new ClientException(`DEBUG.`)
      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, 'Descuento borrado con exito.');
    }catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async cancellationPersonalOtroDescuentoQuery(queryRunner:any, id:number, PersonalId:number){
    let res = await queryRunner.query(`
      SELECT PersonalOtroDescuentoDescuentoId DescuentoId, PersonalOtroDescuentoFechaAplica AplicaEl
      , PersonalOtroDescuentoAnoAplica AnoAplica, PersonalOtroDescuentoMesesAplica MesesAplica
      , PersonalOtroDescuentoCuotaUltNro CuotaUltNro
      FROM PersonalOtroDescuento
      WHERE PersonalOtroDescuentoId IN (@0) AND PersonalId IN (@1)
    `, [id, PersonalId])
    if (!res.length) {
      throw new ClientException(`No se encontro el descuento de la persona.`)
    }
    const PersonalOtroDescuento = res[0]
    const checkrecibos = await this.getPeriodoQuery(queryRunner, PersonalOtroDescuento.AnoAplica, PersonalOtroDescuento.MesesAplica)
    if (checkrecibos[0]?.ind_recibos_generados == 1)
      throw new ClientException(`No se puede modificar descuentos de periodos ya cerrados.`)

    const CuotaUltNro = PersonalOtroDescuento.CuotaUltNro
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    await queryRunner.query(`
      UPDATE PersonalOtroDescuentoCuota SET PersonalOtroDescuentoCuotaAnulacion = @3 WHERE PersonalOtroDescuentoId IN (@0) AND PersonalId IN (@1) AND PersonalOtroDescuentoCuotaId IN (@2)
      UPDATE FROM PersonalOtroDescuento SET PersonalOtroDescuentoFechaAnulacion = @3 WHERE PersonalOtroDescuentoId IN (@0) AND PersonalId IN (@1)
      `, [id, PersonalId, CuotaUltNro, now])
  }


  async cancellationObjetivoDescuento(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const id = Number(req.body.id)
    const ObjetivoId = Number(req.body.ObjetivoId)
    let errors : string[] = []
    try {
      await queryRunner.startTransaction()
      const usuarioId = await this.getUsuarioId(res, queryRunner)
      const ip = this.getRemoteAddress(req)
      
      if (ObjetivoId) { //ObjetivoDescuentos
        await this.cancellationObjetivoDescuentoQuery(queryRunner, id, ObjetivoId)
      } else {
        throw new ClientException(`Error de busqueda.`)
      }

      // throw new ClientException(`DEBUG.`)
      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, 'Descuento borrado con exito.');
    }catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async cancellationObjetivoDescuentoQuery(queryRunner:any, id:number, ObjetivoId:number){
    let res = await queryRunner.query(`
      SELECT 
      , ObjetivoDescuentoAnoAplica AnoAplica, ObjetivoDescuentoMesesAplica MesesAplica
      , ObjetivoDescuentoCuotaUltNro CuotaUltNro
      FROM ObjetivoDescuento
      WHERE ObjetivoDescuentoId IN (@0) AND ObjetivoId IN (@1)
    `, [id, ObjetivoId])
    if (!res.length) {
      throw new ClientException(`No se encontro el descuento del objetivo.`)
    }
    const ObjetivoDescuento = res[0]
    const checkrecibos = await this.getPeriodoQuery(queryRunner, ObjetivoDescuento.AnoAplica, ObjetivoDescuento.MesesAplica)
    if (checkrecibos[0]?.ind_recibos_generados == 1)
      throw new ClientException(`No se puede modificar descuentos de periodos ya cerrados.`)

    const CuotaUltNro = ObjetivoDescuento.CuotaUltNro
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    await queryRunner.query(`
      UPDATE FROM ObjetivoDescuentoCuota SET ObjetivoDescuentoCuotaAnulacion = @3 WHERE ObjetivoDescuentoId IN (@0) AND ObjetivoId IN (@1) AND ObjetivoDescuentoCuotaId IN (@2)
      UPDATE FROM ObjetivoDescuento SET ObjetivoDescuentoFechaAnulacion = @3 WHERE ObjetivoDescuentoId IN (@0) AND ObjetivoId IN (@1)
      `, [id, ObjetivoId, CuotaUltNro, now])

  }

  async getDescuentoPersona(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const PersonalId = req.body.PersonalId
    const DescuentoId = req.body.DescuentoId
    try {
      await queryRunner.startTransaction()
      
      const descuento = await queryRunner.query(`
      SELECT PersonalOtroDescuentoDescuentoId DescuentoId, PersonalOtroDescuentoDetalle Detalle
      , PersonalOtroDescuentoFechaAplica AplicaEl, PersonalOtroDescuentoCantidadCuotas Cuotas
      , PersonalOtroDescuentoImporteVariable Importe, PersonalId
      , PersonalOtroDescuentoId id
      FROM PersonalOtroDescuento WHERE PersonalOtroDescuentoId IN (@0) AND PersonalId IN (@1)
      `, [DescuentoId, PersonalId])
      // throw new ClientException(`DEBUG.`)
      await queryRunner.commitTransaction()
      return this.jsonRes(descuento[0], res);
    }catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async getDescuentoObjetivo(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const ObjetivoId = req.body.ObjetivoId
    const DescuentoId = req.body.DescuentoId
    try {
      await queryRunner.startTransaction()
      
      const descuento = await queryRunner.query(`
      SELECT ObjetivoDescuentoDescuentoId DescuentoId, ObjetivoDescuentoDetalle Detalle
      , ObjetivoDescuentoFechaAplica AplicaEl, ObjetivoDescuentoCantidadCuotas Cuotas
      , ObjetivoDescuentoImporteVariable Importe, ObjetivoId
      , ObjetivoDescuentoId id
      FROM ObjetivoDescuento WHERE ObjetivoDescuentoId IN (@0) AND ObjetivoId IN (@1)
      `, [DescuentoId, ObjetivoId])
      // throw new ClientException(`DEBUG.`)
      
      await queryRunner.commitTransaction()
      return this.jsonRes(descuento[0], res);
    }catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

}