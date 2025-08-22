import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response} from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { copyFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from "fs";
import xlsx from 'node-xlsx';
import { Utils } from "../liquidaciones/liquidaciones.utils";
import { FileUploadController } from "src/controller/file-upload.controller";

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
  // {
  //   id:'GrupoActividadId', name:'GrupoActividadId', field:'GrupoActividadId',
  //   fieldName: 'gap.GrupoActividadId',
  //   type:'number',
  //   searchType: 'number',
  //   sortable: true,
  //   hidden: true,
  //   searchHidden: false
  //   // maxWidth: 50,
  //   // minWidth: 10,
  // },
  {
    id:'tipocuenta_id', name:'Tipo Cuenta', field:'tipocuenta_id',
    fieldName: 'perdes.tipocuenta_id',
    type:'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchComponent: 'inputForTipoCuentaSearch',
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'DescuentoDescripcion', name:'Tipo Movimiento', field:'DescuentoDescripcion',
    fieldName: 'tipdes.DescuentoDescripcion',
    // searchComponent: "",
    type:'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchComponent: 'inputForTipoDescuentoSearch',
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'mes', name:'Mes', field:'mes',
    fieldName: 'perdes.mes',
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
    fieldName: 'perdes.anio',
    type:'number',
    searchType: "number",
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'desmovimiento', name:'Detalle', field:'desmovimiento',
    fieldName: 'perdes.desmovimiento',
    type:'string',
    searchType: "string",
    sortable: true,
    hidden: false,
    searchHidden: false,
    // maxWidth: 50,
    // minWidth: 10,
  },
  // {
  //   id:'tipoint', name:'Tipo', field:'tipoint',
  //   fieldName: '',
  //   type:'string',
  //   searchType: "string",
  //   sortable: true,
  //   hidden: false,
  //   searchHidden: true,
  //   // maxWidth: 50,
  //   // minWidth: 10,
  // },
  {
    id:'importe', name:'Importe Cuota', field:'importe',
    fieldName: "perdes.importe",
    type:'currency',
    searchType: "currency",
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'cuotanro', name:'Cuota Número', field:'cuotanro',
    fieldName:'perdes.cuotanro',
    type:'number',
    searchType: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'cantcuotas', name:'Cantidad Cuotas', field:'cantcuotas',
    fieldName:'perdes.cantcuotas',
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
    fieldName: 'perdes.importetotal',
    type:'currency',
    searchType: "currency",
    sortable: true,
    hidden: false,
    searchHidden: false,
    // maxWidth: 50,
    // minWidth: 10,
  },
  // {
  //   id:'importetotal', name:'Importe Total', field:'importetotal',
  //   fieldName: 'perdes.importetotal',
  //   type:'dateTime',
  //   searchComponent: "inpurForFechaSearch",
  //   searchType: 'date',
  //   sortable: true,
  //   hidden: false,
  //   searchHidden: false,
  // },
  {
    id:'FechaAnulacion', name:'Fecha Anulación', field:'FechaAnulacion',
    fieldName: 'perdes.FechaAnulacion',
    type:'date',
    searchComponent: "inpurForFechaSearch",
    searchType: 'date',
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
   {
     id:'CodObjetivo', name:'Código', field:'CodObjetivo',
     fieldName: "CodObjetivo",
     type:'string',
     searchType: "string",
     sortable: true,
     hidden: false,
     searchHidden: true,
     // minWidth: 50,
     // minWidth: 10,
   },
  {
    id: 'ObjetivoDescripcion', name:'Objetivo', field: 'ObjetivoDescripcion',
    fieldName: "obj.ObjetivoId",
    sortable: true,
    type: 'string',
    searchComponent: "inpurForObjetivoSearch",
    searchType: "number",
    // maxWidth: 170,
    // minWidth: 100,
  },
  /*
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
  */
  {
    id: 'personal', name:'Apellido Nombre', field: 'personal.fullName',
    fieldName: "per.PersonalId",
    type: 'string',
    formatter: 'complexObject',
    params: {
        complexFieldLabel: 'personal.fullName',
    },
    searchComponent: "inpurForPersonalSearch",
    searchType: "number",
    sortable: true,
    hidden: false,
    searchHidden: true,
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
    id:'tipocuenta_id', name:'Tipo Cuenta', field:'tipocuenta_id',
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
    id:'DescuentoDescripcion', name:'Tipo Movimiento', field:'DescuentoDescripcion',
    fieldName: 'det.DescuentoDescripcion',
    searchComponent: 'inpurForDescuentoForObjetivoSearch',
    type:'string',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false,
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
    id:'ObjetivoDescuentoDetalle', name:'Detalle', field:'ObjetivoDescuentoDetalle',
    fieldName: 'des.ObjetivoDescuentoDetalle',
    type:'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'ObjetivoDescuentoImporteVariable', name:'Importe Cuota', field:'ObjetivoDescuentoImporteVariable',
    fieldName: 'cuo.ObjetivoDescuentoImporteVariable',
    type:'currency',
    searchType: 'currency',
    sortable: true,
    hidden: false,
    searchHidden: false,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'cantprocesada', name:'Cuotas Procesadas', field:'cantprocesada',
    fieldName: 'cuo.cantprocesada',
    type:'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'cantcuotas', name:'Cantidad Cuotas', field:'cantcuotas',
    fieldName: 'des.ObjetivoDescuentoCantidadCuotas',
    type:'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'importetotal', name:'Importe Total', field:'importetotal',
    fieldName: 'importetotal',
    type:'currency',
    searchType: 'currency',
    sortable: true,
    hidden: false,
    searchHidden: true,
    // maxWidth: 50,
    // minWidth: 10,
  },
  {
    id:'ObjetivoDescuentoFechaAnulacion', name:'Fecha Anulación', field:'ObjetivoDescuentoFechaAnulacion',
    fieldName: 'des.ObjetivoDescuentoFechaAnulacion',
    type:'date',
    searchComponent: "inpurForFechaSearch",
    searchType: 'date',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
]

const tableOptions:any[] = [
  { label:'Personal', value:'PersonalOtroDescuento'},
  { label:'Objetivo', value:'ObjetivoDescuento'}
]

const aplicaAOptions:any[] = [
  { label:'Cliente', value:'CL'},
  { label:'Coordinador', value:'CO'},
  { label:'Ninguno', value:'NI'}
]

export class GestionDescuentosController extends BaseController {

  directory = process.env.PATH_DOCUMENTS || "tmp";
  constructor() {
    super();
    if (!existsSync(this.directory)) {
      mkdirSync(this.directory, { recursive: true });
    }
  }

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
    // let condition = '(1=1)'
    // if (anio && mes) {
    //   condition = `perdes.anio IN (@1) AND perdes.mes IN (@2)`
    // }
    return await queryRunner.query(`
      SELECT perdes.id
        , cuit.PersonalCUITCUILCUIT
        , CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
        , perdes.tipocuenta_id
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

      FROM VistaPersonalDescuento perdes
      LEFT JOIN Personal per ON per.PersonalId = perdes.PersonalId
      LEFT JOIN Descuento tipdes on tipdes.DescuentoId=perdes.DescuentoId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
      WHERE perdes.anio IN (@1) AND perdes.mes IN (@2)
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
    let condition = '1=1'
    if (anio && mes) {
      condition = `(des.ObjetivoDescuentoAnoAplica = @1 AND des.ObjetivoDescuentoMesesAplica = @2) OR (ISNULL(cuo2.cantprocesadasinmes,0) <> des.ObjetivoDescuentoCantidadCuotas)`
    }
    return await queryRunner.query(`
      SELECT CONCAT(cuo.ObjetivoDescuentoId,'-',cuo.ObjetivoId) id
      , des.ObjetivoId
      , per.PersonalId
      , 'C' tipocuenta_id
      , CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
      , des.ObjetivoDescuentoAnoAplica AS anio
      , des.ObjetivoDescuentoMesesAplica AS mes
      , CONCAT(cli.ClienteId,'/',eledep.ClienteElementoDependienteId) AS CodObjetivo
      , CONCAT(cli.ClienteDenominacion,' ', eledep.ClienteElementoDependienteDescripcion) ObjetivoDescripcion

      , det.DescuentoDescripcion
      , des.ObjetivoDescuentoDetalle 
   
      , des.ObjetivoDescuentoImporteVariable
      , cuo.cantprocesada
      , des.ObjetivoDescuentoCantidadCuotas  AS cantcuotas
      , (des.ObjetivoDescuentoImporteVariable * des.ObjetivoDescuentoCantidad) AS importetotal
      , des.ObjetivoDescuentoFechaAnulacion

      FROM ObjetivoDescuento des  
      JOIN Descuento det ON det.DescuentoId = des.ObjetivoDescuentoDescuentoId
      JOIN Objetivo obj ON obj.ObjetivoId = des.ObjetivoId
		JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
      JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
      
		
		LEFT JOIN (SELECT cuox.ObjetivoDescuentoId, cuox.ObjetivoId, COUNT(*) cantprocesada
		  FROM
		  ObjetivoDescuentoCuota cuox 
		  GROUP BY cuox.ObjetivoDescuentoId, cuox.ObjetivoId
      ) AS cuo ON cuo.ObjetivoDescuentoId = des.ObjetivoDescuentoId AND cuo.ObjetivoId = des.ObjetivoId

		LEFT JOIN (SELECT cuox.ObjetivoDescuentoId, cuox.ObjetivoId, COUNT(*) cantprocesadasinmes
		  FROM
		  ObjetivoDescuentoCuota cuox 
      WHERE cuox.ObjetivoDescuentoCuotaAno*100 + cuox.ObjetivoDescuentoCuotaMes != @1*100+@2
      GROUP BY cuox.ObjetivoDescuentoId, cuox.ObjetivoId
      ) AS cuo2 ON cuo2.ObjetivoDescuentoId = des.ObjetivoDescuentoId AND cuo2.ObjetivoId = des.ObjetivoId
      


		LEFT JOIN ObjetivoPersonalJerarquico coo ON coo.ObjetivoId = des.ObjetivoId AND DATEFROMPARTS(@1,@2,28) > coo.ObjetivoPersonalJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(coo.ObjetivoPersonalJerarquicoHasta, '9999-12-31') AND coo.ObjetivoPersonalJerarquicoDescuentos = 1
      LEFT JOIN Personal per ON per.PersonalId = coo.ObjetivoPersonalJerarquicoPersonalId
      
      WHERE (${condition})
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
      SELECT  perdes.id
        , cuit.PersonalCUITCUILCUIT
        , CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
        , perdes.tipocuenta_id
        , tipdes.DescuentoDescripcion
        , perdes.mes
        , perdes.anio
        , perdes.desmovimiento
        , perdes.desmovimiento2
        , perdes.importe
        , perdes.cuotanro
        , perdes.cantcuotas
        , perdes.importetotal
        , perdes.FechaAnulacion

      FROM VistaPersonalDescuento perdes

      LEFT JOIN Personal per ON per.PersonalId = perdes.PersonalId
      LEFT JOIN Descuento tipdes on tipdes.DescuentoId=perdes.DescuentoId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
      WHERE per.PersonalId IN (@0) AND perdes.anio IN (@1) AND perdes.mes IN (@2)
      `, [ PersonalId, anio, mes])
      // console.log('--------------------------------');
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
    AplicaEl.setHours(0, 0, 0, 0)
    const Cuotas:number = otroDescuento.Cuotas
    const Importe:number = Number(otroDescuento.Importe)
    const Detalle:number = otroDescuento.Detalle

    const anio:number = AplicaEl.getFullYear()
    const mes:number = AplicaEl.getMonth()+1

    //Valida que el período no tenga el indicador de recibos generado
    const checkrecibos = await this.getPeriodoQuery(queryRunner, anio, mes)
    if (checkrecibos[0]?.ind_recibos_generados == 1)
      return new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}, no se puede hacer modificaciones`)

    let PersonalOtroDescuento = await queryRunner.query(`
      SELECT PersonalOtroDescuentoId, PersonalId, PersonalOtroDescuentoDescuentoId, PersonalOtroDescuentoAnoAplica, PersonalOtroDescuentoMesesAplica
      FROM PersonalOtroDescuento
      WHERE PersonalId IN (@0) AND PersonalOtroDescuentoDescuentoId IN (@1) AND PersonalOtroDescuentoAnoAplica IN (@2) AND PersonalOtroDescuentoMesesAplica IN (@3)
    `, [PersonalId, DescuentoId, anio, mes])
    if (PersonalOtroDescuento.length) {
      return new ClientException(`Ya existe un registro del mismo Tipo para el periodo ${mes}/${anio} de la persona.`)
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
      VALUES (@0, @1, @2, @3, @4, @4, 1, @5, ROUND(@6/@5, 2), @7, 0, 1, 1, CONCAT(FORMAT(@4,'00'),'/',@3,' Cuota 1'), @8, @9, @10, @11, @12)

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
    const AplicaA:string = objDescuento.AplicaA
    const DescuentoId:number = objDescuento.DescuentoId
    const ObjetivoId:number = objDescuento.ObjetivoId
    const AplicaEl:Date = objDescuento.AplicaEl? new Date(objDescuento.AplicaEl) : null
    AplicaEl.setHours(0, 0, 0, 0)
    const Cuotas:number = objDescuento.Cuotas
    const Importe:number = Number(objDescuento.Importe)
    const Detalle:number = objDescuento.Detalle

    const anio:number = AplicaEl.getFullYear()
    const mes:number = AplicaEl.getMonth()+1

    //Valida que el período no tenga el indicador de recibos generado
    const checkrecibos = await this.getPeriodoQuery(queryRunner, anio, mes)
    if (checkrecibos[0]?.ind_recibos_generados == 1)
      return new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}, no se puede hacer modificaciones`)

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
      , ObjetivoDescuentoPuesto, ObjetivoDescuentoUsuarioId, ObjetivoDescuentoDia, ObjetivoDescuentoTiempo
      , ObjetivoDescuentoDescontar)
      VALUES (@0, @1, @2, @3, @4, @4, 1, @5, ROUND(@6/@5, 2), @7, 0, 0, 0, @8, @9, @10, @11, @12, @13)

      INSERT ObjetivoDescuentoCuota (ObjetivoDescuentoCuotaId, ObjetivoDescuentoId, ObjetivoId,
        ObjetivoDescuentoCuotaAno, ObjetivoDescuentoCuotaMes, ObjetivoDescuentoCuotaCuota,
        ObjetivoDescuentoCuotaImporte, ObjetivoDescuentoCuotaMantiene, ObjetivoDescuentoCuotaFinalizado,
        ObjetivoDescuentoCuotaProceso)
        VALUES (1,@0,@1,@3,@4,1,ROUND(@6/@5, 2),0,0,'FA')
    `, [ObjetivoDescuentoId, ObjetivoId, DescuentoId, anio, mes, Cuotas, Importe, AplicaEl, Detalle, ip, usuarioId, hoy, hora, AplicaA])

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
      if (PersonalId && !ObjetivoId) {

        if(!req.body.Detalle){
          throw new ClientException('Debe de ingresar un detalle')
        }
   
        const result = await this.addPersonalOtroDescuento(queryRunner, req.body, usuarioId, ip)
        if (result instanceof ClientException) throw result
        else id = result
      }else if (ObjetivoId && !PersonalId) {

        if(!req.body.Detalle){
          throw new ClientException('Debe de ingresar un detalle')
        }
   
        const result = await this.addObjetivoDescuento(queryRunner, req.body, usuarioId, ip)
        if (result instanceof ClientException) throw result
        else id = result
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
    // let errors : string[] = []
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
        SET ObjetivoDescuentoCuotaUltNro = @2, ObjetivoDescuentoCuotasPagas = @2
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
    // let errors : string[] = []
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
    const Importe:number = Number(otroDescuento.Importe)
    const Detalle:string = otroDescuento.Detalle

    const anio:number = AplicaEl.getFullYear()
    const mes:number = AplicaEl.getMonth()+1
    AplicaEl.setHours(0, 0, 0, 0)

    let res = await queryRunner.query(`
      SELECT PersonalOtroDescuentoDescuentoId DescuentoId, PersonalOtroDescuentoFechaAplica AplicaEl
      , PersonalOtroDescuentoAnoAplica AnoAplica, PersonalOtroDescuentoMesesAplica MesesAplica
      , PersonalOtroDescuentoCantidadCuotas Cuotas, PersonalOtroDescuentoImporteVariable Importe
      , PersonalOtroDescuentoDetalle Detalle, PersonalOtroDescuentoCuotaUltNro CuotaUltNro
      , PersonalOtroDescuentoFechaAnulacion FechaAnulacion
      FROM PersonalOtroDescuento
      WHERE PersonalOtroDescuentoId IN (@0) AND PersonalId IN (@1)
    `, [id, PersonalId])
    if (!res.length) {
      throw new ClientException(`No se encontro el descuento de la persona.`)
    }
    const PersonalOtroDescuento = res[0]
    if (PersonalOtroDescuento.FechaAnulacion)
      throw new ClientException(`No se puede modificar descuentos anulados.`)
    const checkrecibos = await this.getPeriodoQuery(queryRunner, PersonalOtroDescuento.AnoAplica, PersonalOtroDescuento.MesesAplica)
    if (checkrecibos[0]?.ind_recibos_generados == 1)
      throw new ClientException(`No se puede modificar descuentos de periodos ya cerrados.`)

    const hoy:Date = new Date()
    const hora = this.getTimeString(hoy)
    hoy.setHours(0, 0, 0, 0)
    await queryRunner.query(`
      UPDATE PersonalOtroDescuento SET
      PersonalOtroDescuentoDescuentoId = @2, PersonalOtroDescuentoAnoAplica = @3
      , PersonalOtroDescuentoMesesAplica = @4, PersonalOtroDescuentoMes = @4
      , PersonalOtroDescuentoCantidadCuotas= @5, PersonalOtroDescuentoImporteVariable = ROUND(@6/@5, 2)
      , PersonalOtroDescuentoFechaAplica = @7, PersonalOtroDescuentoDetalle = @8
      , PersonalOtroDescuentoPuesto = @9, PersonalOtroDescuentoUsuarioId = @10
      , PersonalOtroDescuentoDia = @11, PersonalOtroDescuentoTiempo = @12
      , PersonalOtroDescuentoCuotasPagas = 1, PersonalOtroDescuentoCuotaUltNro = 1
      WHERE PersonalOtroDescuentoId IN (@0) AND PersonalId IN (@1)
      `, [id, PersonalId, DescuentoId, anio, mes, Cuotas, Importe, AplicaEl, Detalle, ip, usuarioId, hoy, hora])
    
    await queryRunner.query(`
      DELETE FROM PersonalOtroDescuentoCuota WHERE PersonalOtroDescuentoId IN (@0) AND PersonalId IN (@1)
    `, [id, PersonalId])

    await queryRunner.query(`
      INSERT INTO PersonalOtroDescuentoCuota (
      PersonalOtroDescuentoCuotaId, PersonalOtroDescuentoId, PersonalId,
      PersonalOtroDescuentoCuotaAno, PersonalOtroDescuentoCuotaMes, PersonalOtroDescuentoCuotaCuota,
      PersonalOtroDescuentoCuotaImporte, PersonalOtroDescuentoCuotaMantiene, PersonalOtroDescuentoCuotaFinalizado,
      PersonalOtroDescuentoCuotaProceso)
      VALUES (1,@0,@1,@2,@3,1,ROUND(@5/@4, 2),0,0,'FA')
    `, [id, PersonalId, anio, mes, Cuotas, Importe])
  }

  private async updateObjetivoDescuento(queryRunner:any, otroDescuento:any, usuarioId:number, ip:string){
    const id:number = otroDescuento.id
    const AplicaA:string = otroDescuento.AplicaA
    const DescuentoId:number = otroDescuento.DescuentoId
    const ObjetivoId:number = otroDescuento.ObjetivoId
    const AplicaEl:Date = otroDescuento.AplicaEl? new Date(otroDescuento.AplicaEl) : null
    const Cuotas:number = otroDescuento.Cuotas
    const Importe:number = Number(otroDescuento.Importe)
    const Detalle:string = otroDescuento.Detalle

    const anio:number = AplicaEl.getFullYear()
    const mes:number = AplicaEl.getMonth()+1
    AplicaEl.setHours(0, 0, 0, 0)

    let res = await queryRunner.query(`
      SELECT ObjetivoDescuentoDescuentoId DescuentoId, ObjetivoDescuentoFechaAplica AplicaEl
      , ObjetivoDescuentoAnoAplica AnoAplica, ObjetivoDescuentoMesesAplica MesesAplica
      , ObjetivoDescuentoCantidadCuotas Cuotas, ObjetivoDescuentoImporteVariable Importe
      , ObjetivoDescuentoDetalle Detalle, ObjetivoDescuentoCuotaUltNro CuotaUltNro
      , ObjetivoDescuentoFechaAnulacion FechaAnulacion
      FROM ObjetivoDescuento
      WHERE ObjetivoDescuentoId IN (@0) AND ObjetivoId IN (@1)
    `, [id, ObjetivoId])
    if (!res.length) {
      throw new ClientException(`No se encontro el descuento del objetivo.`)
    }
    const ObjetivoDescuento = res[0]
    if (ObjetivoDescuento.FechaAnulacion)
      throw new ClientException(`No se puede modificar descuentos anulados.`)
    const checkrecibos = await this.getPeriodoQuery(queryRunner, ObjetivoDescuento.AnoAplica, ObjetivoDescuento.MesesAplica)
    if (checkrecibos[0]?.ind_recibos_generados == 1)
      throw new ClientException(`No se puede modificar descuentos de periodos ya cerrados.`)

    const hoy:Date = new Date()
    const hora = this.getTimeString(hoy)
    hoy.setHours(0, 0, 0, 0)
    await queryRunner.query(`
      UPDATE ObjetivoDescuento SET
      ObjetivoDescuentoDescuentoId = @2, ObjetivoDescuentoAnoAplica = @3
      , ObjetivoDescuentoMesesAplica = @4, ObjetivoDescuentoMes = @4
      , ObjetivoDescuentoCantidadCuotas= @5, ObjetivoDescuentoImporteVariable = ROUND(@6/@5, 2)
      , ObjetivoDescuentoFechaAplica = @7, ObjetivoDescuentoDetalle = @8
      , ObjetivoDescuentoPuesto = @9, ObjetivoDescuentoUsuarioId = @10
      , ObjetivoDescuentoDia = @11, ObjetivoDescuentoTiempo = @12
      , ObjetivoDescuentoCuotasPagas = 1, ObjetivoDescuentoCuotaUltNro = 1
      , ObjetivoDescuentoDescontar = @13
      WHERE ObjetivoDescuentoId IN (@0) AND ObjetivoId IN (@1)
    `, [id, ObjetivoId, DescuentoId, anio, mes, Cuotas, Importe, AplicaEl, Detalle, ip, usuarioId, hoy, hora, AplicaA])
    
    await queryRunner.query(`
      DELETE FROM ObjetivoDescuentoCuota WHERE ObjetivoDescuentoId IN (@0) AND ObjetivoId IN (@1)
    `, [id, ObjetivoId])

    await queryRunner.query(`
      INSERT ObjetivoDescuentoCuota (ObjetivoDescuentoCuotaId, ObjetivoDescuentoId, ObjetivoId,
      ObjetivoDescuentoCuotaAno, ObjetivoDescuentoCuotaMes, ObjetivoDescuentoCuotaCuota,
      ObjetivoDescuentoCuotaImporte, ObjetivoDescuentoCuotaMantiene, ObjetivoDescuentoCuotaFinalizado,
      ObjetivoDescuentoCuotaProceso)
      VALUES (1,@0,@1,@2,@3,1,ROUND(@5/@4, 2),0,0,'FA')
    `,[id, ObjetivoId, anio, mes, Cuotas, Importe])
    
  }

  async cancellationPersonalOtroDescuento(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const id:number = Number(req.body.id)
    const PersonalId:number = Number(req.body.PersonalId)
    const DetalleAnulacion:string = req.body.DetalleAnulacion
    let campos_vacios:string[] = []
    try {
      await queryRunner.startTransaction()
      // const usuarioId = await this.getUsuarioId(res, queryRunner)
      // const ip = this.getRemoteAddress(req)
     if(!req.body.DetalleAnulacion){
      throw new ClientException('Debe de ingresar un detalle de anulación')
     }
      if (PersonalId) { //PersonalOtrosDescuentos
        await this.cancellationPersonalOtroDescuentoQuery(queryRunner, id, PersonalId, DetalleAnulacion)
      } else {
        throw new ClientException(`Error de busqueda.`)
      }

      // throw new ClientException(`DEBUG.`)
      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, 'Descuento anulado con exito.');
    }catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async cancellationPersonalOtroDescuentoQuery(queryRunner:any, id:number, PersonalId:number, DetalleAnulacion:string){
    let res = await queryRunner.query(`
      SELECT PersonalOtroDescuentoDescuentoId DescuentoId, PersonalOtroDescuentoFechaAplica AplicaEl
      , PersonalOtroDescuentoAnoAplica AnoAplica, PersonalOtroDescuentoMesesAplica MesesAplica
      , PersonalOtroDescuentoCuotaUltNro CuotaUltNro, PersonalOtroDescuentoFechaAnulacion FechaAnulacion
      FROM PersonalOtroDescuento
      WHERE PersonalOtroDescuentoId IN (@0) AND PersonalId IN (@1)
    `, [id, PersonalId])
    if (!res.length) {
      throw new ClientException(`No se encontro el descuento de la persona.`)
    }
    const PersonalOtroDescuento = res[0]
    if (PersonalOtroDescuento.FechaAnulacion)
      throw new ClientException(`No se puede modificar descuentos anulados.`)
    const checkrecibos = await this.getPeriodoQuery(queryRunner, PersonalOtroDescuento.AnoAplica, PersonalOtroDescuento.MesesAplica)
    if (checkrecibos[0]?.ind_recibos_generados == 1)
      throw new ClientException(`No se puede modificar descuentos de periodos ya cerrados.`)

    const CuotaUltNro = PersonalOtroDescuento.CuotaUltNro
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    await queryRunner.query(`
      UPDATE PersonalOtroDescuentoCuota SET PersonalOtroDescuentoCuotaAnulacion = @3 WHERE PersonalOtroDescuentoId IN (@0) AND PersonalId IN (@1) AND PersonalOtroDescuentoCuotaId IN (@2)
      UPDATE PersonalOtroDescuento SET PersonalOtroDescuentoFechaAnulacion = @3, PersonalOtroDescuentoDetalleAnulacion = @4 WHERE PersonalOtroDescuentoId IN (@0) AND PersonalId IN (@1)
      `, [id, PersonalId, CuotaUltNro, now, DetalleAnulacion])
  }


  async cancellationObjetivoDescuento(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const id:number = Number(req.body.id)
    const ObjetivoId:number = Number(req.body.ObjetivoId)
    const DetalleAnulacion:string = req.body.DetalleAnulacion
    let campos_vacios : string[] = []
    try {
      await queryRunner.startTransaction()
      // const usuarioId = await this.getUsuarioId(res, queryRunner)
      // const ip = this.getRemoteAddress(req)
      if (!DetalleAnulacion.length) campos_vacios.push("- Motivo de anulación");

      if (campos_vacios.length) {
        campos_vacios.unshift('Debe completar los siguientes campos: ')
        throw new ClientException(campos_vacios)
      }
      
      if (ObjetivoId) { //ObjetivoDescuentos
        await this.cancellationObjetivoDescuentoQuery(queryRunner, id, ObjetivoId, DetalleAnulacion)
      } else {
        throw new ClientException(`Error de busqueda.`)
      }

      // throw new ClientException(`DEBUG.`)
      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, 'Descuento anulado con exito.');
    }catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async cancellationObjetivoDescuentoQuery(queryRunner:any, id:number, ObjetivoId:number, DetalleAnulacion:string){
    let res = await queryRunner.query(`
      SELECT ObjetivoDescuentoAnoAplica AnoAplica, ObjetivoDescuentoMesesAplica MesesAplica
      , ObjetivoDescuentoCuotaUltNro CuotaUltNro, ObjetivoDescuentoFechaAnulacion FechaAnulacion
      FROM ObjetivoDescuento
      WHERE ObjetivoDescuentoId IN (@0) AND ObjetivoId IN (@1)
    `, [id, ObjetivoId])
    if (!res.length) {
      throw new ClientException(`No se encontro el descuento del objetivo.`)
    }
    const ObjetivoDescuento = res[0]
    if (ObjetivoDescuento.FechaAnulacion)
      throw new ClientException(`No se puede modificar descuentos anulados.`)
    const checkrecibos = await this.getPeriodoQuery(queryRunner, ObjetivoDescuento.AnoAplica, ObjetivoDescuento.MesesAplica)
    if (checkrecibos[0]?.ind_recibos_generados == 1)
      throw new ClientException(`No se puede modificar descuentos de periodos ya cerrados.`)

    const CuotaUltNro = ObjetivoDescuento.CuotaUltNro
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    await queryRunner.query(`
      UPDATE ObjetivoDescuentoCuota SET ObjetivoDescuentoCuotaAnulacion = @3 WHERE ObjetivoDescuentoId IN (@0) AND ObjetivoId IN (@1) AND ObjetivoDescuentoCuotaId IN (@2)
      UPDATE ObjetivoDescuento SET ObjetivoDescuentoFechaAnulacion = @3, ObjetivoDescuentoDetalleAnulacion = @4 WHERE ObjetivoDescuentoId IN (@0) AND ObjetivoId IN (@1)
      `, [id, ObjetivoId, CuotaUltNro, now, DetalleAnulacion])

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
      , PersonalOtroDescuentoDetalleAnulacion DetalleAnulacion
      , PersonalOtroDescuentoFechaAnulacion FechaAnulacion
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
      , ObjetivoDescuentoDescontar AplicaA
      , ObjetivoDescuentoDetalleAnulacion DetalleAnulacion
      , ObjetivoDescuentoFechaAnulacion FechaAnulacion
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

  async getDescuentoForObjetivo(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await queryRunner.query(`
        SELECT DescuentoId value, DescuentoDescripcion label
        FROM Descuento
        WHERE DescuentoUsadoEnObjetivo = 1
      `)
      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  async getDescuentoForPersonal(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await queryRunner.query(`
        SELECT DescuentoId value, DescuentoDescripcion label
        FROM Descuento
        WHERE DescuentoUsadoEnPersonal = 1
      `)
      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  async getTableOptions(req: any, res: Response, next: NextFunction) {
    try {
      this.jsonRes(tableOptions, res);
    } catch (error) {
      return next(error)
    }
  }

  async handleXLSUpload(req: Request, res: Response, next: NextFunction) {
    const anioRequest = Number(req.body.anio)
    const mesRequest = Number(req.body.mes)
    const descuentoIdRequest = Number(req.body.descuentoId)
    const tableNameRequest = req.body.tableName
    const queryRunner = dataSource.createQueryRunner();

    const usuario = res.locals.userName
    const usuarioId = await this.getUsuarioId(res, queryRunner)
    const ip = this.getRemoteAddress(req)
    let den_documento:string = ''
    const fechaActual:Date = new Date()
    const file = {...req.file, doctipo_id:'DES', tableForSearch:'Documento'}

    let columnsnNotFound = []
    let dataset:any = []
    let idError:number = 0

    debugger
    try {
      if (!tableNameRequest) throw new ClientException("Faltó indicar Tipo de carga");
      if (!descuentoIdRequest) throw new ClientException("Faltó indicar Tipo de descuento");
      if (!anioRequest) throw new ClientException("Faltó indicar el anio");
      if (!mesRequest) throw new ClientException("Faltó indicar el mes");

      await queryRunner.connect();
      await queryRunner.startTransaction();

      //Valida que el período no tenga el indicador de recibos generado
      const checkrecibos = await this.getPeriodoQuery(queryRunner, anioRequest, mesRequest)
      if (checkrecibos[0]?.ind_recibos_generados == 1)
        throw new ClientException(`Ya se encuentran generados los recibos para el período ${anioRequest}/${mesRequest}, no se puede hacer modificaciones`)

      const workSheetsFromBuffer = xlsx.parse(readFileSync(file.path))
      const sheet1 = workSheetsFromBuffer[0];
      const columnsName: Array<string> = sheet1.data[0]

      //Tranformo el array en un objeto con claves como los elementos del array y valores como sus índices
      const columnsXLS: any = columnsName.reduce((acc, column, index) => {
        acc[column] = index;
        return acc;
      }, {} as Record<string, number>);

      sheet1.data.splice(0, 1)

      //Obtengo la descripcion del descuento
      const Descuento:any = await queryRunner.query(`
        SELECT DescuentoId, TRIM(DescuentoDescripcion) AS Descripcion FROM Descuento WHERE DescuentoId IN (@0)
      `, [descuentoIdRequest])
      const DescuentoDescripcion = Descuento[0].Descripcion

      switch (tableNameRequest) {
        case 'PersonalOtroDescuento':
          //Validar que esten las columnas nesesarias
          if (isNaN(columnsXLS['CUIT'])) columnsnNotFound.push('- CUIT')
          if (isNaN(columnsXLS['Cantidad Cuotas'])) columnsnNotFound.push('- Cantidad Cuotas')
          if (isNaN(columnsXLS['Importe Total'])) columnsnNotFound.push('- ImporteTotal')
          if (isNaN(columnsXLS['Detalle'])) columnsnNotFound.push('- Detalle')

          if (columnsnNotFound.length) {
            columnsnNotFound.unshift('Faltan las siguientes columnas:')
            throw new ClientException(columnsnNotFound)
          }

          den_documento = `Personal-${DescuentoDescripcion}-${mesRequest}-${anioRequest}`

          for (const row of sheet1.data) {
            
            //Finaliza cuando la fila esta vacia
            if (
              !row[columnsXLS['CUIT']]
              && !row[columnsXLS['Cantidad Cuotas']]
              && !row[columnsXLS['Importe Total']]
              && !row[columnsXLS['Detalle']]
            ) break
            
            //Verifica que exista el CUIT
            const PersonalCUITCUIL = await queryRunner.query(`
              SELECT cuit.PersonalId
              FROM PersonalCUITCUIL cuit 
              WHERE cuit.PersonalCUITCUILCUIT IN (@0) AND PersonalCUITCUILHasta IS NULL
            `, [row[columnsXLS['CUIT']]])
            if (!PersonalCUITCUIL.length) {
              dataset.push({id: idError++, CUIT:row[columnsXLS['CUIT']], Detalle: 'CUIT no encontrado'})
              continue
            }
            const otroDescuento:any = {
              DescuentoId: descuentoIdRequest,
              PersonalId: PersonalCUITCUIL[0].PersonalId,
              AplicaEl: new Date(anioRequest, mesRequest-1, 1),
              Cuotas: row[columnsXLS['Cantidad Cuotas']],
              Importe: row[columnsXLS['Importe Total']],
              Detalle: row[columnsXLS['Detalle']],
            }
            const result = await this.addPersonalOtroDescuento(queryRunner, otroDescuento, usuarioId, ip)
            if (result instanceof ClientException) {
              dataset.push({id: idError++, CUIT:row[columnsXLS['CUIT']], Detalle: result.messageArr})
              continue
            }
          }
        break;
        case 'ObjetivoDescuento':
          //Validar que esten las columnas nesesarias
          if (isNaN(columnsXLS['Aplica A'])) columnsnNotFound.push('- Aplica A')
          if (isNaN(columnsXLS['Codigo'])) columnsnNotFound.push('- Codigo')
          if (isNaN(columnsXLS['Cantidad Cuotas'])) columnsnNotFound.push('- Cantidad Cuotas')
          if (isNaN(columnsXLS['Importe Total'])) columnsnNotFound.push('- Importe Total')
          if (isNaN(columnsXLS['Detalle'])) columnsnNotFound.push('- Detalle')
          if (isNaN(columnsXLS['CUIT Cliente'])) columnsnNotFound.push('- CUIT Cliente')

          if (columnsnNotFound.length) {
            columnsnNotFound.unshift('Faltan las siguientes columnas:')
            throw new ClientException(columnsnNotFound)
          }

          den_documento = `Objetivo-${DescuentoDescripcion}-${mesRequest}-${anioRequest}`

          for (const row of sheet1.data) {
            //Finaliza cuando la fila esta vacia
            if (
              !row[columnsXLS['Aplica A']]
              && !row[columnsXLS['Codigo']]
              && !row[columnsXLS['Cantidad Cuotas']]
              && !row[columnsXLS['Importe Total']]
              && !row[columnsXLS['Detalle']]
              && !row[columnsXLS['CUIT Cliente']]
            ) break

            //Verifica que exista el Codigo del objetivo
            const array = row[columnsXLS['Codigo']].split('/')
            const ClienteId:number = parseInt(array[0])
            const ClienteElementoDependienteId:number = parseInt(array[1])
            const Objetivo = await queryRunner.query(`
              SELECT ObjetivoId FROM Objetivo WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1
            `, [ClienteId, ClienteElementoDependienteId])
            if (!Objetivo.length) {
              dataset.push({id: idError++, Codigo:row[columnsXLS['Codigo']], Detalle: 'Codigo no encontrado'})
              continue
            }
            const ObjetivoId = Objetivo[0].ObjetivoId
            //Verifica que exista el cuit del cliente y que el id sea el mismo del excel
            const clienteCUIT = row[columnsXLS['CUIT Cliente']]
            const cliente = await queryRunner.query(`
              SELECT cli.ClienteId, cli.ClienteElementoDependienteId FROM ClienteElementoDependiente cli 
                LEFT JOIN ClienteFacturacion clif ON clif.ClienteId = cli.ClienteId AND clif.ClienteFacturacionDesde <= @0 
                AND ISNULL(clif.ClienteFacturacionHasta, '9999-12-31') >= @0
              WHERE clif.ClienteFacturacionCUIT = @1
            `, [fechaActual, clienteCUIT])

            if (cliente.length == 0) {
              dataset.push({ id: idError++, Codigo:row[columnsXLS['Codigo']], Detalle: `El CUIT no existe en la base de datos`})
              continue
            }
            if (cliente[0].ClienteId != ClienteId) {
              dataset.push({ id: idError++, Codigo:row[columnsXLS['Codigo']], Detalle: `El CUIT no coincide con el código del objetivo`})
              continue
            }
            //Verifico que exita el Aplica A
            const AplicaA = this.getValueByLabel(row[columnsXLS['Aplica A']])
            if (!AplicaA) {
              dataset.push({id: idError++, Codigo:row[columnsXLS['Codigo']], Detalle: 'Aplica A no identificado'})
              continue
            }
            const otroDescuento:any = {
              DescuentoId: descuentoIdRequest,
              AplicaA: AplicaA,
              ObjetivoId: ObjetivoId,
              AplicaEl: new Date(anioRequest, mesRequest-1, 1),
              Cuotas: row[columnsXLS['Cantidad Cuotas']],
              Importe: row[columnsXLS['Importe Total']],
              Detalle: row[columnsXLS['Detalle']],
            }
            const result = await this.addObjetivoDescuento(queryRunner, otroDescuento, usuarioId, ip)
            if (result instanceof ClientException) {
              dataset.push({id: idError++, Codigo:row[columnsXLS['Codigo']], Detalle: result.messageArr})
              continue
            }
          }
        break;
      
        default:
          throw new ClientException(`Tipo de carga no identificado`)
          break;
      }
      
      if (dataset.length) {
        throw new ClientException(`Hubo ${dataset.length} errores que no permiten importar el archivo`, {list: dataset})
      }

      await FileUploadController.handleDOCUpload(null, null, null, null, fechaActual, null, den_documento, anioRequest, mesRequest, file, usuario, ip, queryRunner)

      await queryRunner.commitTransaction();
      this.jsonRes([], res, "XLS Recibido y procesado!");
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release();
      unlinkSync(file.path);
    }
  }

  async getAplicaAOptions(req: any, res: Response, next: NextFunction) {
    try {
      this.jsonRes(aplicaAOptions, res);
    } catch (error) {
      return next(error)
    }
  }

  private getValueByLabel(label: string): string | null {
    const normalizedLabel = label.trim().toLowerCase();
    const item = aplicaAOptions.find((opt:any) => opt.label.toLowerCase() === normalizedLabel)
    return item ? item.value : null;
  }

}