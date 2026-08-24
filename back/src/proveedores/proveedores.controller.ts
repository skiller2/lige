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

const proveedorColumns: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "ProveedorId",
    type: "number",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    name: "Razón Social",
    type: "string",
    id: "ProveedorRazonSocial",
    field: "ProveedorRazonSocial",
    fieldName: "ProveedorRazonSocial",
    // searchComponent: "inputForClientSearch",
    // searchType: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    name: "CUIT",
    id: "CUIT",
    field: "CUIT",
    fieldName: "CUIT",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
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
    id: "ProveedorInactivo",
    field: "ProveedorInactivo",
    fieldName: "ProveedorInactivo",
    type: "string",
    formatter: 'collectionFormatter',
    params: { collection: getInactivo },
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
];

export class ProveedoresController extends BaseController {

  async getGridCols(req, res) {
    this.jsonRes(proveedorColumns, res);
  }

  async listProveedores(req: any, res: any, next: any) {
    const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
    const filterSql = filtrosToSql(options.filtros, proveedorColumns);
    const orderBy = orderToSQL(options.sort)
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const proveedor = await queryRunner.query(
        `SELECT ProveedorId id, CONVERT(VARCHAR(1), ISNULL(ProveedorInactivo, 0)) ProveedorInactivo, ProveedorRazonSocial, CUIT
        FROM Proveedor
        WHERE ${filterSql} ${orderBy}`)

      this.jsonRes(proveedor, res);

    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async getProveedorByIdQuery(queryRunner: QueryRunner, proveedorId: number) {
    let data = await queryRunner.query(
      `SELECT pro.ProveedorId, pro.ProveedorInactivo, TRIM(pro.ProveedorRazonSocial) ProveedorRazonSocial, pro.CUIT,
      dom.DomicilioJson
      FROM Proveedor pro
      LEFT JOIN NexoDomicilio AS nex ON nex.PersonalId = pro.ProveedorId AND nex.NexoDomicilioActual = 1
      LEFT JOIN Domicilio AS dom ON dom.DomicilioId = nex.DomicilioId
      WHERE pro.ProveedorId = @0`, 
      [proveedorId]
    )
    if (!data.length)  null
    const Proveedor = data[0]
    Proveedor.domicilio = JSON.parse(Proveedor.DomicilioJson)

    return Proveedor
  }

  async getProveedorById(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName)
    const ProveedorId = Number(req.params.id)
    try {
      let data = await this.getProveedorByIdQuery(queryRunner, ProveedorId)
      const contactos = await this.getContactosByProveedorId(queryRunner, ProveedorId)
      data.contactos = contactos

      this.jsonRes(data, res);
    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async getContactosByProveedorId(queryRunner: any, ProveedorId: number) {
    const contactos = await queryRunner.query(
      `SELECT 
        con.ContactoId,
        con.ContactoNombre,
        con.ContactoApellido,
        con.ContactoArea,
        con.ContactoJurImpositiva,
        con.ContactoTipoCod,
        tele.TipoTelefonoId,
        tele.ContactoTelefonoNro,
        email.ContactoEmailEmail
      FROM Contacto AS con
      LEFT JOIN ContactoEmail AS email ON email.ContactoId = con.ContactoId
      LEFT JOIN ContactoTelefono AS tele ON tele.ContactoId = con.ContactoId
      
      WHERE con.ProveedorId IN (@0)`, 
      [ProveedorId]
    )
    return contactos
  }

  async valProveedoresForm(queryRunner:QueryRunner, form:any, type:string){
    
    let campos_vacios: any[] = []
    if (!form.ProveedorRazonSocial) 
      campos_vacios.push(`- Razón Social`)

    if (!Number.isInteger(form.CUIT) || form.CUIT.toString().length != 11)
      campos_vacios.push(`- CUIT`)

    if (campos_vacios.length) {
      campos_vacios.unshift('Debe completar los siguientes campos: ')
      return new ClientException(campos_vacios)
    }

    const valDomicilio = await domicilioController.valObjDomicilio(queryRunner, form.domicilio)
    if (valDomicilio instanceof ClientException) {
      return valDomicilio
    }

    switch (type) {
      case 'D':
        
        break;
    
      default:
        break;
    }
  }

  async addProveedor(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName)
    const body = req.body
    
    try {
      const valDomicilio = await this.valProveedoresForm(queryRunner, body, 'C')
      if (valDomicilio instanceof ClientException) {
        throw valDomicilio
      }

      const usuario = res.locals.userName
      const ip = this.getRemoteAddress(req)

      const ProveedorId = await this.insertProveedor(queryRunner, body, usuario, ip)
      const DomicilioId = await domicilioController.addDomicilio(queryRunner, body.domicilio, null)
      //Agregar NexoDomicilio
      await queryRunner.query(
        `INSERT INTO NexoDomicilio (
            DomicilioId, NexoDomicilioActual, NexoDomicilioComercial, NexoDomicilioOperativo, NexoDomicilioConstituido, NexoDomicilioLegal, ProveedorId
        ) VALUES ( @0,@1,@2,@3,@4,@5,@6)`, 
        [ DomicilioId, 1, 1, 1, 1, 1, ProveedorId ]
      )
      //Agregar Contactos de Provedor
      await this.ProveedorContactoUpdate(queryRunner, body.contactos, ProveedorId)

      this.jsonRes({ProveedorId}, res);
    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async ProveedorContactoUpdate(queryRunner: any, contactos: any, ProveedorId: number) {
    //Elimino los contactos antiguos no declarados del provedor
    const ContactoIds = contactos.map((row: { ContactoId: any; }) => row.ContactoId).filter((id) => id !== null && id !== undefined);
    if (ContactoIds.length > 0) { 
      await queryRunner.query(`DELETE e FROM ContactoEmail e
        JOIN Contacto c ON c.ContactoId = e.ContactoId
        WHERE c.ProveedorId = @0 AND e.ContactoId NOT IN (${ContactoIds.join(',')}) `, [ProveedorId])
      await queryRunner.query(`DELETE t FROM ContactoTelefono t 
        JOIN Contacto c ON c.ContactoId = t.ContactoId
        WHERE c.ProveedorId = @0 AND t.ContactoId NOT IN (${ContactoIds.join(',')}) `, [ProveedorId])
      await queryRunner.query(`DELETE FROM Contacto WHERE ProveedorId = @0  AND ContactoId NOT IN (${ContactoIds.join(',')})`, [ProveedorId]);
    }

    //Crea uno por uno los contactos
    for (const [idx, contacto] of contactos.entries()) {
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
          await queryRunner.query(`INSERT INTO Contacto (ProveedorId,ContactoArea,ContactoApellido,ContactoNombre,ContactoTelefonoUltNro,ContactoEmailUltNro,ContactoApellidoNombre,ContactoTipoCod,ContactoJurImpositiva )
              VALUES ( @0,@1,@2,@3,@4,@5,@6,@7,@8)`, [
              ProveedorId, contacto.ContactoArea, contacto.ContactoApellido, contacto.ContactoNombre, ContactoTelefonoUltNro, ContactoEmailUltNro, ContactoApellidoNombre, contacto.ContactoTipoCod, contacto.ContactoJurImpositiva])
          const resContacto = await queryRunner.query(`SELECT IDENT_CURRENT('Contacto')`)
          ContactoId = resContacto[0][''];
      }

      if (contacto.correo)
        await queryRunner.query(`INSERT INTO ContactoEmail (ContactoEmailId,ContactoId,ContactoEmailEmail,ContactoEmailInactivo) VALUES (
        @0,@1,@2,@3)`, [++ContactoEmailUltNro, ContactoId, contacto.ContactoEmailEmail, false])

      if (contacto.telefono)
        await queryRunner.query(`INSERT INTO ContactoTelefono (ContactoTelefonoId,ContactoId,TipoTelefonoId,ContactoTelefonoNro) 
          VALUES (@0,@1,@2,@3)`, [++ContactoTelefonoUltNro, contacto.ContactoId, contacto.TipoTelefonoId, contacto.ContactoTelefonoNro])
      await queryRunner.query(`UPDATE Contacto SET ContactoTelefonoUltNro=@1,ContactoEmailUltNro=@2  WHERE ContactoId=@0 `,
        [contacto.ContactoId, ContactoTelefonoUltNro, ContactoEmailUltNro])
    }
  }

  async insertProveedor(queryRunner:QueryRunner, proveedor:any, usuario: string, ip: string){
    let insert:any = await queryRunner.query(`
      INSERT INTO Proveedor (
        CUIT, ProveedorRazonSocial, ProveedorTipoEmpresa, ProveedorInactivo
      ) VALUES (@0,@1,@2,@3,@4)
      SELECT IDENT_CURRENT('Proveedor')`, 
      [proveedor.CUIT, proveedor.ProveedorRazonSocial, 'P', 0]
    )
    return insert[0][''] //ProveedorId
  }
  

}