import type { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { QueryRunner } from "typeorm";
import { filtrosToSql, isOptions, orderToSQL, getOptionsSINO } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";
import { domicilioController } from "../controller/controller.module.ts"
import { logger } from "../logger/logger.ts";

const getInactivo: any[] = [
  { label: 'Si', value: '0' },
  { label: 'No', value: '1' },
]

const depositoColumns: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "dep.DepositoId",
    type: "number",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    id: "DepositoNombre",
    name: "Deposito",
    field: "DepositoNombre",
    fieldName: "dep.DepositoNombre",
    type: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    id: "Domicilio",
    name: "Domicilio",
    field: "Domicilio",
    fieldName: "Domicilio",
    type: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    name: "Contacto",
    id: "Contacto",
    field: "Contacto",
    fieldName: "",
    type: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    name: "Activo",
    id: "DepositoInactivo",
    field: "DepositoInactivo",
    fieldName: "isnull(dep.DepositoInactivo, 0)",
    type: "string",
    formatter: 'collectionFormatter',
    params: { collection: getInactivo },
    searchComponent: "inputForInactivo",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
];

export class DepositosController extends BaseController {

  async getGridCols(req, res) {
    this.jsonRes(depositoColumns, res);
  }

  async listDepositos(req: any, res: any, next: any) {
    const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
    const filterSql = filtrosToSql(options.filtros, depositoColumns);
    const orderBy = orderToSQL(options.sort)
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const depositos = await queryRunner.query(
        `SELECT dep.DepositoId id, suc.SucursalDescripcion, 
        CONVERT(VARCHAR(1), ISNULL(dep.DepositoInactivo, 0)) DepositoInactivo, dep.DepositoNombre, dep.IndRequiereObservacion
        FROM Deposito dep
        LEFT JOIN Sucursal suc ON suc.SucursalId = dep.DepositoSucursalId
        LEFT JOIN Contacto con ON con.DepositoId = dep.DepositoId
        WHERE ${filterSql} ${orderBy}`)

      this.jsonRes(depositos, res);

    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async getDepositoByIdQuery(queryRunner: QueryRunner, depositoId: number) {
    let data = await queryRunner.query(
      `SELECT dep.DepositoId, dep.DepositoInactivo, TRIM(dep.DepositoNombre) DepositoNombre,
      suc.SucursalDescripcion, 
      nex.DomicilioId, dom.DomicilioJson
      FROM Deposito dep
      LEFT JOIN NexoDomicilio AS nex ON nex.DepositoId = dep.DepositoId AND nex.NexoDomicilioActual = 1
      LEFT JOIN Domicilio AS dom ON dom.DomicilioId = nex.DomicilioId
      LEFT JOIN Sucursal suc ON suc.SucursalId = dep.DepositoSucursalId
      LEFT JOIN Contacto con ON con.DepositoId = dep.DepositoId
      WHERE dep.ProveedorId = @0`,
      [depositoId]
    )
    if (!data.length) return null
    const Proveedor = data[0]
    Proveedor.domicilio = JSON.parse(Proveedor.DomicilioJson)

    return Proveedor
  }

  async getDepositoById(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName)
    const DepositoId = Number(req.params.id)
    try {
      let data = await this.getDepositoByIdQuery(queryRunner, DepositoId)
      const contactos = await this.getContactosByDepositoId(queryRunner, DepositoId)
      data.contactos = contactos

      this.jsonRes(data, res);
    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async getContactosByDepositoId(queryRunner: any, DepositoId: number) {
    const contactos = await queryRunner.query(
      `SELECT 
        con.ContactoId,
        TRIM(con.ContactoNombre) ContactoNombre,
        TRIM(con.ContactoApellido) ContactoApellido,
        con.ContactoArea,
        con.ContactoJurImpositiva,
        con.ContactoTipoCod,
        tele.TipoTelefonoId,
        TRIM(tele.ContactoTelefonoNro) ContactoTelefonoNro,
        email.ContactoEmailEmail
      FROM Contacto AS con
      LEFT JOIN ContactoEmail AS email ON email.ContactoId = con.ContactoId
      LEFT JOIN ContactoTelefono AS tele ON tele.ContactoId = con.ContactoId
      
      WHERE con.DepositoId IN (@0)`,
      [DepositoId]
    )
    return contactos
  }

  async valDepositosForm(queryRunner: QueryRunner, form: any, type: string) {

    const valDomicilio = await domicilioController.valObjDomicilio(queryRunner, form.domicilio)
    if (valDomicilio instanceof ClientException) {
      return valDomicilio
    }

  }

  async addDeposito(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName)
    const body = req.body

    try {
      await queryRunner.startTransaction()

      const valForm = await this.valDepositosForm(queryRunner, body, 'C')
      if (valForm instanceof ClientException) {
        throw valForm
      }

      const usuario = res.locals.userName
      const ip = this.getRemoteAddress(req)

      const DepositoId = await this.insertProveedor(queryRunner, body, usuario, ip)
      const DomicilioId = await domicilioController.addDomicilio(queryRunner, body.domicilio, null)
      // Agregar NexoDomicilio
      await queryRunner.query(
        `INSERT INTO NexoDomicilio (
            DomicilioId, NexoDomicilioActual, NexoDomicilioComercial, NexoDomicilioOperativo, NexoDomicilioConstituido, NexoDomicilioLegal, DepositoId
        ) VALUES ( @0,@1,@2,@3,@4,@5,@6)`, 
        [ DomicilioId, 1, 1, 1, 1, 1, DepositoId ]
      )
      //Agregar Contactos de Deposito
      await this.depositoContactoUpdate(queryRunner, body.contactos, DepositoId)

      await queryRunner.commitTransaction()
      this.jsonRes({ DepositoId }, res, 'Carga Exitosa');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async depositoContactoUpdate(queryRunner: any, contactos: any, DepositoId: number) {
    contactos = contactos || []

    //Validar que los campos no esten vacios
    let campos_vacios: string[] = []
    const contactosVal: any[] = []
    for (const [idx, contacto] of contactos.entries()) {
      const contactoVacio = !contacto.ContactoApellido && !contacto.ContactoNombre && !contacto.ContactoArea &&
        !contacto.ContactoEmailEmail && !contacto.ContactoTelefonoNro && !contacto.ContactoTipoCod && !contacto.ContactoJurImpositiva

      if (contactoVacio) continue //Fila de contacto vacía, se omite (proveedor sin contacto)

      if (!contacto.ContactoTipoCod) campos_vacios.push(`- Tipo del contacto ${idx + 1}`)
      // if (!contacto.ContactoJurImpositiva) campos_vacios.push(`- Jurisdicción Impositiva del contacto ${idx + 1}`)
      if (!contacto.ContactoApellido) campos_vacios.push(`- Apellido del contacto ${idx + 1}`)
      if (!contacto.ContactoNombre) campos_vacios.push(`- Nombre del contacto ${idx + 1}`)
      if (!contacto.ContactoArea) campos_vacios.push(`- Área del contacto ${idx + 1}`)
      if (!contacto.ContactoEmailEmail) campos_vacios.push(`- Email del contacto ${idx + 1}`)
      if (!contacto.ContactoTelefonoNro) campos_vacios.push(`- Teléfono del contacto ${idx + 1}`)
      contactosVal.push(contacto)
    }

    if (campos_vacios.length) {
      campos_vacios.unshift('Debe completar los siguientes campos: ')
      throw new ClientException(campos_vacios)
    }

    //Elimino los contactos antiguos no declarados del deposito
    const ContactoIds = contactosVal.map((row: { ContactoId: any; }) => Number(row.ContactoId)).filter((id: number) => id > 0);
    const ContactoIdsSql = ContactoIds.length ? ContactoIds.join(',') : '0' //Sin ids declarados se borran todos los contactos del proveedor
   
    await queryRunner.query(`DELETE e FROM ContactoEmail e
      JOIN Contacto c ON c.ContactoId = e.ContactoId
      WHERE c.DepositoId = @0 AND e.ContactoId NOT IN (${ContactoIdsSql}) `, [DepositoId])
    await queryRunner.query(`DELETE t FROM ContactoTelefono t
      JOIN Contacto c ON c.ContactoId = t.ContactoId
      WHERE c.DepositoId = @0 AND t.ContactoId NOT IN (${ContactoIdsSql}) `, [DepositoId])
    await queryRunner.query(`DELETE FROM Contacto WHERE DepositoId = @0  AND ContactoId NOT IN (${ContactoIdsSql})`, [DepositoId]);

    //Crea uno por uno los contactos
    for (const contacto of contactosVal) {
      const ContactoApellidoNombre = (contacto.ContactoApellido ? contacto.ContactoApellido : '') + (contacto.ContactoApellido && contacto.ContactoNombre ? ',' : '') + (contacto.ContactoNombre ? contacto.ContactoNombre : '') || null;
      let ContactoTelefonoUltNro = 0
      let ContactoEmailUltNro = 0
      let ContactoId = contacto.ContactoId

      if (contacto.ContactoId) {  //Actualizo contacto
        await queryRunner.query(`DELETE FROM ContactoEmail WHERE ContactoId = @0`, [contacto.ContactoId]);
        await queryRunner.query(`DELETE FROM ContactoTelefono WHERE ContactoId = @0`, [contacto.ContactoId]);
        await queryRunner.query(`UPDATE Contacto SET  ContactoArea=@1,ContactoApellido=@2,ContactoNombre=@3,ContactoApellidoNombre=@4,ContactoTipoCod=@5,ContactoJurImpositiva=@6 WHERE ContactoId=@0 `,
          [contacto.ContactoId, contacto.ContactoArea, contacto.ContactoApellido, contacto.ContactoNombre, ContactoApellidoNombre, contacto.ContactoTipoCod, contacto.ContactoJurImpositiva])
      } else { //Nuevo contacto
        await queryRunner.query(`INSERT INTO Contacto (DepositoId,ContactoArea,ContactoApellido,ContactoNombre,ContactoTelefonoUltNro,ContactoEmailUltNro,ContactoApellidoNombre,ContactoTipoCod,ContactoJurImpositiva )
              VALUES ( @0,@1,@2,@3,@4,@5,@6,@7,@8)`, [
          DepositoId, contacto.ContactoArea, contacto.ContactoApellido, contacto.ContactoNombre, ContactoTelefonoUltNro, ContactoEmailUltNro, ContactoApellidoNombre, contacto.ContactoTipoCod, contacto.ContactoJurImpositiva])
        const resContacto = await queryRunner.query(`SELECT IDENT_CURRENT('Contacto')`)
        ContactoId = resContacto[0][''];
      }

      if (contacto.ContactoEmailEmail)
        await queryRunner.query(`INSERT INTO ContactoEmail (ContactoEmailId,ContactoId,ContactoEmailEmail,ContactoEmailInactivo) VALUES (
        @0,@1,@2,@3)`, [++ContactoEmailUltNro, ContactoId, contacto.ContactoEmailEmail, false])

      if (contacto.ContactoTelefonoNro)
        await queryRunner.query(`INSERT INTO ContactoTelefono (ContactoTelefonoId,ContactoId,TipoTelefonoId,ContactoTelefonoNro)
          VALUES (@0,@1,@2,@3)`, [++ContactoTelefonoUltNro, ContactoId, contacto.TipoTelefonoId, contacto.ContactoTelefonoNro])
      await queryRunner.query(`UPDATE Contacto SET ContactoTelefonoUltNro=@1,ContactoEmailUltNro=@2  WHERE ContactoId=@0 `,
        [ContactoId, ContactoTelefonoUltNro, ContactoEmailUltNro])
    }
  }

  async insertProveedor(queryRunner: QueryRunner, deposito: any, usuario: string, ip: string) {
    let insert: any = await queryRunner.query(`
      INSERT INTO Deposito (
        
      ) VALUES ()
      SELECT IDENT_CURRENT('Deposito')`,
      []
    )
    return insert[0][''] //DepositoId
  }

  async updateDeposito(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName)
    const body = req.body
    const DepositoId = req.body.DepositoId
    try {
      await queryRunner.startTransaction()

      const valForm = await this.valDepositosForm(queryRunner, body, 'U')
      if (valForm instanceof ClientException) {
        throw valForm
      }

      // const usuario = res.locals.userName
      // const ip = this.getRemoteAddress(req)

      await domicilioController.updateDomicilio(queryRunner, body.DomicilioId, body.domicilio, null)
      //Agregar Contactos del Deposito
      await this.depositoContactoUpdate(queryRunner, body.contactos, DepositoId)

      await this.updateDepositoIdQuery(queryRunner, body)

      await queryRunner.commitTransaction()
      this.jsonRes({ DepositoId }, res, 'Actualización Exitosa');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async updateDepositoIdQuery(queryRunner: QueryRunner, DepositoId: any) {
    await queryRunner.query(
      ``,
      []
    )
  }

  async setDepositoIdInactivo(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName)
    const DepositoId = Number(req.params.id)

    try {
      await queryRunner.startTransaction()

      await queryRunner.commitTransaction()
      this.jsonRes({}, res, "Deposito Inactivo");
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

}