import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";

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
    fieldName: "",
    type:'number',
    searchType: "number",
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
    searchType: "number",
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
    id:'PersonalOtroDescuentoDetalle', name:'Desmovimiento', field:'PersonalOtroDescuentoDetalle',
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
  // {
  //   id:'importetotal', name:'Importe Total', field:'importetotal',
  //   fieldName: '',
  //   type:'float',
  //   searchType: 'float',
  //   sortable: true,
  //   hidden: false,
  //   searchHidden: true,
  //   // maxWidth: 50,
  //   // minWidth: 10,
  // },
]

export class GestionDescuentosController extends BaseController {

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
      , @0 AS anio
      , @1 AS mes
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
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@0,@1,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@0,@1,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')

      WHERE cuo.PersonalOtroDescuentoCuotaAno = @0 AND cuo.PersonalOtroDescuentoCuotaMes = @1
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
      , @0 AS anio
      , @1 AS mes
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
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@0,@1,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@0,@1,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')

      WHERE cuo.PersonalDescuentoCuotaAno = @0 AND cuo.PersonalDescuentoCuotaMes = @1
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
      , @0 AS anio
      , @1 AS mes
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
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@0,@1,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@0,@1,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')

      WHERE des.PersonalPrepagaDescuentoPeriodo=CONCAT(FORMAT(CONVERT(INT, @1), '00'),'/',@0)
      AND (${filterSql})
      ${orderBy}
    `, [anio, mes])
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
      , @0 AS anio
      , @1 AS mes
      , det.DescuentoDescripcion AS tipomov
      , CONCAT(des.ObjetivoDescuentoDetalle, ' ', CONCAT(' ', obj.ClienteId,'/', ISNULL(obj.ClienteElementoDependienteId,0), ' ', obj.ObjetivoDescripcion)) AS desmovimiento
      , 'OTRO' tipoint
      , cuo.ObjetivoDescuentoCuotaImporte AS importe
      , cuo.ObjetivoDescuentoCuotaCuota AS cuotanro
      , des.ObjetivoDescuentoCantidadCuotas  AS cantcuotas
      , (des.ObjetivoDescuentoImporteVariable * des.ObjetivoDescuentoCantidad) AS importetotal
      , obj.ObjetivoDescripcion
      FROM ObjetivoDescuentoCuota cuo 
      JOIN ObjetivoDescuento des ON cuo.ObjetivoDescuentoId = des.ObjetivoDescuentoId AND cuo.ObjetivoId = des.ObjetivoId
      LEFT JOIN ObjetivoPersonalJerarquico coo ON coo.ObjetivoId = des.ObjetivoId AND DATEFROMPARTS(@0,@1,28) > coo.ObjetivoPersonalJerarquicoDesde AND DATEFROMPARTS(@0,@1,28) < ISNULL(coo.ObjetivoPersonalJerarquicoHasta, '9999-12-31') AND coo.ObjetivoPersonalJerarquicoDescuentos = 1
      JOIN Descuento det ON det.DescuentoId = des.ObjetivoDescuentoDescuentoId
      JOIN Objetivo obj ON obj.ObjetivoId = des.ObjetivoId
      JOIN Personal per ON per.PersonalId = coo.ObjetivoPersonalJerarquicoPersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@0,@1,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@0,@1,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')
      WHERE cuo.ObjetivoDescuentoCuotaAno = @0 AND cuo.ObjetivoDescuentoCuotaMes = @1
      AND des.ObjetivoDescuentoDescontarCoordinador = 'S'
      AND (${filterSql})
      ${orderBy}
    `, [anio, mes])
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
        descuento.objetivo = { id:descuento.ObjetivoId, descripcion:descuento.ObjetivoDescripcion }
        delete descuento.PersonalId;
        delete descuento.ApellidoNombre;
        delete descuento.ObjetivoId;
        delete descuento.ObjetivoDescripcion;
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
      , @0 AS anio
      , @1 AS mes
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
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@0,@1,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@0,@1,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')

      WHERE cuo.PersonalOtroDescuentoCuotaAno = @0 AND cuo.PersonalOtroDescuentoCuotaMes = @1 AND per.PersonalId IN (@2)

      UNION ALL

      -- DESCUENTO EFECTO
      SELECT DISTINCT
      'G' as tipocuenta_id
      , @0 AS anio
      , @1 AS mes
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
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@0,@1,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@0,@1,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')

      WHERE cuo.PersonalDescuentoCuotaAno = @0 AND cuo.PersonalDescuentoCuotaMes = @1 AND per.PersonalId IN (@2)

      UNION ALL

      -- DESCUENTO PREPAGA
      SELECT 
      'G' as tipocuenta_id
      , @0 AS anio
      , @1 AS mes
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
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@0,@1,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@0,@1,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')

      WHERE des.PersonalPrepagaDescuentoPeriodo=CONCAT(FORMAT(CONVERT(INT, @1), '00'),'/',@0) AND per.PersonalId IN (@2)
      `, [anio, mes, PersonalId])
      // console.log('descuentos: ', descuentos.length);
        
      this.jsonRes(descuentos, res);
    } catch (error) {
      return next(error)
    }
  }

}