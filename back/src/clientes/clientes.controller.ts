import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { QueryResult } from "typeorm";
import { FileUploadController } from "../controller/file-upload.controller"
//import { info } from "pdfjs-dist/types/src/shared/util";



export class ClientesController extends BaseController {

    listaColumnas: any[] = [
        {
            id: "id",
            name: "id",
            field: "id",
            fieldName: "cli.ClienteId",
            type: "number",
            sortable: false,
            hidden: true,
            searchHidden: true
        },
        {
            name: "Cliente",
            type: "string",
            id: "ClienteId",
            field: "ClienteId",
            fieldName: "cli.ClienteId",
            searchComponent: "inpurForClientSearch",
            sortable: true,
            hidden: true,
            searchHidden: false
        },
        {
            name: "CUIT",
            type: "string",
            id: "ClienteFacturacionCUIT",
            field: "ClienteFacturacionCUIT",
            fieldName: "fac.ClienteFacturacionCUIT",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Razón Social",
            type: "string",
            id: "ClienteApellidoNombre",
            field: "ClienteApellidoNombre",
            fieldName: "cli.ClienteApellidoNombre",
            searchType: "string",
            sortable: true,

            searchHidden: false,
            hidden: false,
        },
        {
            name: "Nombre Fantasía",
            type: "string",
            id: "ClienteNombreFantasia",
            field: "ClienteNombreFantasia",
            fieldName: "cli.ClienteNombreFantasia",
            searchType: "string",
            searchHidden: false
        },
        {
            name: "Fecha de Alta",
            type: "date",
            id: "ClienteFechaAlta",
            field: "ClienteFechaAlta",
            fieldName: "inpurForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        },

        {
            name: "Domicilio",
            type: "string",
            id: "Domicilio",
            field: "Domicilio",
            fieldName: "domcli.ClienteDomicilioDomCalle",
            sortable: true,
            searchHidden: true
        },
        {
            name: "Cantidad de objetivos activos",
            type: "number",
            id: "CantidadObjetivos",
            field: "CantidadObjetivos",
            fieldName: "CantidadObjetivos",
            sortable: true,
            hidden: false,
            searchHidden: true
        },
    ];

    async getGridCols(req, res) {
        this.jsonRes(this.listaColumnas, res);
    }


    async listClientes(req: any, res: Response, next: NextFunction) {

        const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()

        try {

            const clientes = await queryRunner.query(
                `SELECT 
        cli.ClienteId AS id, 
        cli.ClienteId,
        fac.ClienteFacturacionCUIT,
        con.CondicionAnteIVADescripcion,
        cli.ClienteApellidoNombre, 
        cli.ClienteNombreFantasia, 
        cli.ClienteFechaAlta,
        CONCAT_WS(' ', 
            TRIM(domcli.ClienteDomicilioDomCalle), 
            TRIM(domcli.ClienteDomicilioDomNro)
        ) AS Domicilio,
        cant.CantidadObjetivos
    FROM 
        Cliente cli
        LEFT JOIN ClienteFacturacion fac ON fac.ClienteId = cli.ClienteId 
            AND fac.ClienteFacturacionDesde <= @0 
            AND ISNULL(fac.ClienteFacturacionHasta, '9999-12-31') >= @0
        LEFT JOIN CondicionAnteIVA con ON con.CondicionAnteIVAId = fac.CondicionAnteIVAId
        LEFT JOIN (
            SELECT 
                domcli.ClienteId, 
                domcli.ClienteDomicilioDomCalle, 
                domcli.ClienteDomicilioDomNro
            FROM 
                ClienteDomicilio domcli
            WHERE 
                domcli.ClienteDomicilioActual = 1
            AND domcli.ClienteDomicilioId = (
                SELECT MAX(ClienteDomicilioId) 
                FROM ClienteDomicilio 
                WHERE ClienteId = domcli.ClienteId 
                AND ClienteDomicilioActual = 1
            )
        ) AS domcli ON domcli.ClienteId = cli.ClienteId
			LEFT JOIN (SELECT DISTINCT 
   obj.ClienteId, 
	COUNT(DISTINCT obj.ObjetivoId) CantidadObjetivos
        
    FROM Objetivo obj


    LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
    LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId 
    AND @0 >= eledepcon.ClienteElementoDependienteContratoFechaDesde AND ISNuLL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') >= @0 AND ISNuLL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,'9999-12-31') >= @0
    
    LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId 

        
        
    WHERE 
      eledepcon.ClienteElementoDependienteContratoFechaDesde IS NOT NULL
GROUP BY obj.ClienteId) cant ON cant.ClienteId=cli.ClienteId        

    WHERE 
        ${filterSql}
${orderBy}`, [fechaActual])

            this.jsonRes(
                {
                    total: clientes.length,
                    list: clientes,
                },
                res
            );

        } catch (error) {
            return next(error)
        }

    }

    async infoCliente(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const clienteId = req.params.id
            let infoCliente = await this.getObjetivoClienteQuery(queryRunner, clienteId)
            let infoClienteContacto = await this.getClienteContactoQuery(queryRunner, clienteId)
            let domiclio = await this.getClienteDomicilioQuery(queryRunner, clienteId)

            if (domiclio) {
                infoCliente = { ...infoCliente[0], ...domiclio[0] }
            } else {
                infoCliente = infoCliente[0]
            }
            infoCliente.infoDomicilio = domiclio
            infoCliente.infoDomicilioOriginal = domiclio
            infoCliente.infoClienteContacto = infoClienteContacto
            infoCliente.infoClienteContactoOriginal = infoClienteContacto
            await queryRunner.commitTransaction()
            return this.jsonRes(infoCliente, res)
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }


    async getClienteDomicilioQuery(queryRunner: any, clienteId: any) {

        return await queryRunner.query(`
            SELECT 
                 domcli.ClienteDomicilioId
                ,TRIM(domcli.ClienteDomicilioDomCalle) AS ClienteDomicilioDomCalle
                ,TRIM(domcli.ClienteDomicilioDomNro) AS ClienteDomicilioDomNro
                ,TRIM(domcli.ClienteDomicilioCodigoPostal) AS ClienteDomicilioCodigoPostal
                ,domcli.ClienteDomicilioPaisId AS domiciliopais
                ,domcli.ClienteDomicilioProvinciaId
                ,domcli.ClienteDomicilioLocalidadId
                ,domcli.ClienteDomicilioBarrioId
                ,TRIM(domcli.ClienteDomicilioDomLugar) AS ClienteDomicilioDomLugar
            FROM ClienteDomicilio AS domcli
            WHERE domcli.ClienteId = @0
                AND domcli.ClienteDomicilioActual = 1
            ORDER BY domcli.ClienteDomicilioId DESC `, [clienteId])

    }

    async getClienteContactoQuery(queryRunner: any, clienteId: any) {
        return await queryRunner.query(`
        SELECT 
            TRIM(cc.ContactoNombre) AS nombre,
            cc.ContactoId,
            TRIM(cc.ContactoApellido) AS ContactoApellido,
            TRIM(cc.ContactoArea) AS area,
            cc.ContactoEmailUltNro,
            cc.ContactoTelefonoUltNro,
            cct.TipoTelefonoId,

            cct.ContactoTelefonoId,
            TRIM(cce.ContactoEmailEmail) AS correo ,
            TRIM(cct.ContactoTelefonoNro) AS telefono,
            cce.ContactoEmailId
        FROM  Contacto cc
        LEFT JOIN ContactoEmail cce ON 
            cc.ContactoId = cce.ContactoId
        LEFT JOIN ContactoTelefono cct ON 
            cc.ContactoId = cct.ContactoId
        WHERE  cc.ClienteId= @0`,
            [clienteId])
    }

    async getObjetivoClienteQuery(queryRunner: any, clienteId: any) {
        const fechaActual = new Date()
        const anio = fechaActual.getFullYear()
        const mes = fechaActual.getMonth() + 1
        return await queryRunner.query(`SELECT cli.ClienteId AS id
            ,cli.ClienteId
            ,fac.ClienteFacturacionCUIT
            ,fac.ClienteFacturacionId
            ,fac.CondicionAnteIVAId
            ,TRIM(con.CondicionAnteIVADescripcion) AS CondicionAnteIVADescripcion
            ,TRIM(cli.ClienteApellidoNombre) AS ClienteApellidoNombre 
            ,TRIM(cli.ClienteNombreFantasia) AS ClienteNombreFantasia
            ,cli.ClienteFechaAlta
            ,cli.ClienteAdministradorUltNro
            ,TRIM(adm.AdministradorNombre) AS AdministradorNombre
            ,TRIM(adm.AdministradorApellido) AS AdministradorApellido
            ,adm.AdministradorId
            ,cli.ClienteContactoUltNro
            ,cli.ClienteTelefonoUltNro
            ,cli.ClienteEmailUltNro
            ,cli.ClienteDomicilioUltNro
        FROM Cliente cli
        LEFT JOIN ClienteFacturacion fac 
            ON fac.ClienteId = cli.ClienteId
             AND fac.ClienteFacturacionDesde <= @3
            AND ISNULL(fac.ClienteFacturacionHasta, '9999-12-31') >= @3
        LEFT JOIN CondicionAnteIVA con 
            ON con.CondicionAnteIVAId = fac.CondicionAnteIVAId
        LEFT JOIN (
            SELECT TOP 1 ca.ClienteId
                ,ca.ClienteAdministradorAdministradorId AS AdministradorId
                ,adm.AdministradorNombre
                ,adm.AdministradorApellido
            FROM ClienteAdministrador ca
            JOIN Administrador adm 
                ON adm.AdministradorId = ca.ClienteAdministradorAdministradorId
            WHERE ca.ClienteId = @0
            ORDER BY ca.ClienteAdministradorId DESC
        ) AS adm 
            ON adm.ClienteId = cli.ClienteId
        WHERE cli.ClienteId = @0;
        `,
            [clienteId, anio, mes, fechaActual])
    }

    async getCondicionQuery(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            const CondicionAnteIva = await queryRunner.query(`SELECT CondicionAnteIVAId,CondicionAnteIVADescripcion from CondicionAnteIVA`)
            return this.jsonRes(CondicionAnteIva, res);
        } catch (error) {
            return next(error)
        } finally {

        }

    }

    async getTipoTelefono(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            const tipoTelefono = await queryRunner.query(`SELECT * FROM TipoTelefono`)
            return this.jsonRes(tipoTelefono, res);
        } catch (error) {
            return next(error)
        } finally {

        }

    }

    async getProvinciasQuery(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            const provincias = await queryRunner.query(`SELECT ProvinciaId,ProvinciaDescripcion FROM Provincia WHERE PaisId  = 1`)
            return this.jsonRes(provincias, res);
        } catch (error) {
            return next(error)
        } finally {

        }

    }

    async getLocalidadQuery(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            const localidad = await queryRunner.query(`SELECT LocalidadId, ProvinciaId, localidadDescripcion FROM Localidad  WHERE PaisId = 1`)
            return this.jsonRes(localidad, res);
        } catch (error) {
            return next(error)
        } finally {

        }

    }

    async getBarrioQuery(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            const barrio = await queryRunner.query(`SELECT BarrioId,ProvinciaId,LocalidadId,BarrioDescripcion FROM Barrio WHERE PaisId = 1 `)
            return this.jsonRes(barrio, res);
        } catch (error) {
            return next(error)
        } finally {

        }

    }


    async updateCliente(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();

        try {
            await queryRunner.startTransaction()
            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            const ClienteId = Number(req.params.id)
            const ObjCliente = { ...req.body }
            let ObjClienteNew = { infoDomicilio: {}, infoClienteContacto: {} }

            console.log("ObjCliente ", ObjCliente)
            //throw new ClientException(`test`)

            //validaciones
            await this.FormValidations(ObjCliente, queryRunner)
            //validacion de barrio
            if (ObjCliente.DomicilioProvinciaId && ObjCliente.DomicilioLocalidadId && !ObjCliente.DomicilioBarrioId) {

                let queryBarrio = await queryRunner.query(`SELECT BarrioId,ProvinciaId,LocalidadId,BarrioDescripcion FROM Barrio WHERE PaisId = 1 AND ProvinciaId = @0 AND LocalidadId = @1`,
                    [ObjCliente.DomicilioProvinciaId, ObjCliente.DomicilioLocalidadId])

                if (queryBarrio && queryBarrio.length > 0)
                    throw new ClientException(`Debe completar el campo barrio.`)

            }

            const ClienteFechaAlta = new Date(ObjCliente.ClienteFechaAlta)
            ClienteFechaAlta.setHours(0, 0, 0, 0)

            //aca se actualiza lo relacionado a cliente adminsitrador
            let ClienteAdministradorId = await this.ClienteAdministrador(queryRunner, ObjCliente, ClienteId)

            //se actualiza la tabla cliente
            await this.updateClienteTable(queryRunner, ClienteId, ObjCliente.ClienteNombreFantasia, ObjCliente.ClienteApellidoNombre, ClienteFechaAlta, ClienteAdministradorId);

            //se actualiza lo relacionado a cliente facturacion
            const ClienteFacturacionId = await this.ClienteFacturacion(queryRunner, ObjCliente, ClienteId, ClienteFechaAlta)
            ObjCliente.ClienteFacturacionId = ClienteFacturacionId

            // se actualiza el domicilio

            //            ObjClienteNew = await this.ClienteDomicilioUpdate(queryRunner,ClienteId,ObjCliente)

            ObjClienteNew.infoDomicilio = await this.ClienteDomicilioUpdate(queryRunner, ObjCliente.infoDomicilio, ClienteId)

            ObjClienteNew.infoClienteContacto = await this.ClienteContactoUpdate(queryRunner, ObjCliente.infoClienteContacto, ClienteId)

            // inser y update cliente contacto
            //ObjClienteNew = await this.ClienteContacto(queryRunner,ObjCliente,ClienteId)


            if (ObjCliente.files?.length > 0) {

                await FileUploadController.handlePDFUpload(ClienteId, 'Cliente', 'CLI', 'cliente_id', ObjCliente.files, usuario, ip)
            }
            await queryRunner.commitTransaction()
            return this.jsonRes(ObjClienteNew, res, 'Modificación  Exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async ClienteDomicilioUpdate(queryRunner: any, domicilios: any, ClienteId: number) {
        const DomicilioIds = domicilios.map((row: { ClienteDomicilioId: any; }) => row.ClienteDomicilioId).filter((id) => id !== null && id !== undefined);
        console.log("DomicilioIds ", DomicilioIds)
        if (DomicilioIds.length > 0)
            await queryRunner.query(`DELETE FROM ClienteDomicilio WHERE ClienteId = @0 AND ClienteDomicilioId NOT IN (${DomicilioIds.join(',')})`, [ClienteId])

        const res = await queryRunner.query(`SELECT ClienteDomicilioUltNro FROM Cliente WHERE ClienteId = @0`, [ClienteId])
        let ClienteDomicilioUltNro = (res[0].ClienteDomicilioUltNro) ? res[0].ClienteDomicilioUltNro : 0

        for (const [idx, domicilio] of domicilios.entries()) {
            if (domicilio.ClienteDomicilioId) {
                await queryRunner.query(`UPDATE ClienteDomicilio
                    SET ClienteDomicilioDomCalle = @2,ClienteDomicilioDomNro = @3, ClienteDomicilioCodigoPostal = @4, 
                    ClienteDomicilioProvinciaId = @5,ClienteDomicilioLocalidadId = @6,ClienteDomicilioBarrioId = @7,ClienteDomicilioDomLugar=@8
                    WHERE ClienteId = @0 AND ClienteDomicilioId = @1`, [
                    ClienteId, domicilio.ClienteDomicilioId, domicilio.ClienteDomicilioDomCalle, domicilio.ClienteDomicilioDomNro, domicilio.ClienteDomicilioCodigoPostal,
                    domicilio.ClienteDomicilioProvinciaId, domicilio.ClienteDomicilioLocalidadId, domicilio.ClienteDomicilioBarrioId, domicilio.ClienteDomicilioDomLugar])
            } else {
                ClienteDomicilioUltNro++
                await queryRunner.query(`INSERT INTO ClienteDomicilio (
                    ClienteId, ClienteDomicilioId, ClienteDomicilioDomLugar, ClienteDomicilioDomCalle, ClienteDomicilioDomNro, ClienteDomicilioCodigoPostal, 
                    ClienteDomicilioPaisId, ClienteDomicilioProvinciaId, ClienteDomicilioLocalidadId, ClienteDomicilioBarrioId, ClienteDomicilioActual) 
                    VALUES ( @0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10 )`, [ClienteId,
                    ClienteDomicilioUltNro, domicilio.ClienteDomicilioDomLugar, domicilio.ClienteDomicilioDomCalle, domicilio.ClienteDomicilioDomNro,
                    domicilio.ClienteDomicilioCodigoPostal, 1, domicilio.ClienteDomicilioProvinciaId, domicilio.ClienteDomicilioLocalidadId,
                    domicilio.ClienteDomicilioBarrioId, 1
                ])
                domicilios[idx].ClienteDomicilioId = ClienteDomicilioUltNro
            }
        }

        await queryRunner.query(`UPDATE Cliente SET ClienteDomicilioUltNro = @1 WHERE ClienteId = @0`, [ClienteId, ClienteDomicilioUltNro])

        return domicilios
    }

    async ClienteContactoUpdate(queryRunner: any, contactos: any, ClienteId: number) {
        const ContactoIds = contactos.map((row: { ContactoId: any; }) => row.ContactoId).filter((id) => id !== null && id !== undefined);
        if (ContactoIds.length > 0) {
            await queryRunner.query(`DELETE e FROM ContactoEmail e
                JOIN Contacto c ON c.ContactoId = e.ContactoId
                WHERE c.ClienteId = @0 AND e.ContactoId NOT IN (${ContactoIds.join(',')}) `,[ClienteId])
            await queryRunner.query(`DELETE t FROM ContactoTelefono t 
                JOIN Contacto c ON c.ContactoId = t.ContactoId
                WHERE c.ClienteId = @0 AND t.ContactoId NOT IN (${ContactoIds.join(',')}) `,[ClienteId])
            await queryRunner.query(`DELETE FROM Contacto WHERE ClienteId = @0  AND ContactoId NOT IN (${ContactoIds.join(',')})`, [ClienteId]);
        }

        for (const [idx, contacto] of contactos.entries()) {
            const ContactoApellidoNombre = (contacto.ContactoApellido ? contacto.ContactoApellido : '') + (contacto.ContactoApellido && contacto.nombre ? ',' : '') + (contacto.nombre ? contacto.nombre : '') || null;
            let ContactoTelefonoUltNro = 0
            let ContactoEmailUltNro = 0
            let ContactoId = contacto.ContactoId

            if (contacto.ContactoId) {  //Actualizo contacto
                await queryRunner.query(`DELETE FROM ContactoEmail WHERE ContactoId = @0`, [contacto.ContactoId]);
                await queryRunner.query(`DELETE FROM ContactoTelefono WHERE ContactoId = @0`, [contacto.ContactoId]);
                await queryRunner.query(`UPDATE Contacto SET  ContactoArea=@1,ContactoApellido=@2,ContactoNombre=@3,ContactoApellidoNombre=@4 WHERE ContactoId=@0 `,
                    [contacto.ContactoId, contacto.area, contacto.ContactoApellido, contacto.nombre, ContactoApellidoNombre])
            } else { //Nuevo contacto
                await queryRunner.query(`INSERT INTO Contacto (ClienteId,ContactoArea,ContactoApellido,ContactoNombre,ContactoTelefonoUltNro,ContactoEmailUltNro,ContactoApellidoNombre )
                    VALUES ( @0,@1,@2,@3,@4,@5,@6)`, [
                    ClienteId, contacto.area, contacto.ContactoApellido, contacto.nombre, ContactoTelefonoUltNro, ContactoEmailUltNro, ContactoApellidoNombre])
                const resContacto = await queryRunner.query(`SELECT IDENT_CURRENT('Contacto')`)
                ContactoId = resContacto[0][''];
                contactos[idx].ContactoId = ContactoId
            }

            if (contacto.correo)
                await queryRunner.query(`INSERT INTO ContactoEmail (ContactoEmailId,ContactoId,ContactoEmailEmail,ContactoEmailInactivo) VALUES (
                @0,@1,@2,@3)`, [++ContactoEmailUltNro, ContactoId, contacto.correo, false])

            if (contacto.telefono)
                await queryRunner.query(`INSERT INTO ContactoTelefono (ContactoTelefonoId,ContactoId,TipoTelefonoId,ContactoTelefonoNro) 
                  VALUES (@0,@1,@2,@3,@4)`, [++ContactoTelefonoUltNro, contacto.ContactoId, contacto.TipoTelefonoId, contacto.telefono])
            await queryRunner.query(`UPDATE Contacto SET ContactoTelefonoUltNro=@1,ContactoEmailUltNro=@2  WHERE ContactoId=@0 `,
                [contacto.ContactoId, ContactoTelefonoUltNro, ContactoEmailUltNro])
            contactos[idx].ContactoEmailUltNro = ContactoEmailUltNro
            contactos[idx].ContactoTelefonoUltNro = ContactoTelefonoUltNro
        }

        return contactos
    }

    async ClienteAdministrador(queryRunner: any, ObjCliente: any, ClienteId: any) {

        let ClienteAdministradorId = null

        if (ObjCliente.AdministradorId) {
            ClienteAdministradorId = ObjCliente.ClienteAdministradorUltNro || 1;
            if (ObjCliente.ClienteAdministradorUltNro) {
                await this.updateAdministradorTable(queryRunner, ClienteId, ObjCliente.ClienteAdministradorUltNro, ObjCliente.AdministradorId);
            } else {
                await this.insertClienteAdministrador(queryRunner, ClienteId, ClienteAdministradorId, ObjCliente.ClienteFechaAlta, ObjCliente.AdministradorId);
            }
        } else if (ObjCliente.ClienteAdministradorUltNro) {
            await this.DeleteClienteAdministrador(queryRunner, ObjCliente, ClienteId);
        }

        return ClienteAdministradorId
    }

    async ClienteFacturacion(queryRunner: any, ObjCliente: any, ClienteId: any, ClienteFechaAlta: any) {

        let ClienteFacturacionId
        if (ObjCliente.ClienteFacturacionId) {
            ClienteFacturacionId = ObjCliente.ClienteFacturacionId
            await this.updateFacturaTable(queryRunner, ClienteId, ObjCliente.ClienteFacturacionId, ObjCliente.ClienteFacturacionCUIT, ObjCliente.CondicionAnteIVAId);
        } else {
            ClienteFacturacionId = 1;
            await this.insertClienteFacturacion(queryRunner, ClienteId, ClienteFacturacionId, ObjCliente.ClienteFacturacionCUIT, ObjCliente.CondicionAnteIVAId, ClienteFechaAlta);
            await this.updateClienteTableforFactura(queryRunner, ClienteId, ClienteFacturacionId);
        }

        return ClienteFacturacionId
    }

    async updateFacturaTable(queryRunner: any, ClienteId: number, ClienteFacturacionId: string, ClienteFacturacionCUIT: string, CondicionAnteIVAId: number) {


        await queryRunner.query(`UPDATE ClienteFacturacion
        SET ClienteFacturacionCUIT = @2,CondicionAnteIVAId = @3
        WHERE ClienteId = @0 AND ClienteFacturacionId = @1`, [ClienteId, ClienteFacturacionId, ClienteFacturacionCUIT, CondicionAnteIVAId])
    }


    async updateClienteTable(queryRunner: any, ClienteId: number, ClienteNombreFantasia: string, ClienteApellidoNombre: string, ClienteFechaAlta: Date, ClienteAdministradorId: any) {

        await queryRunner.query(`UPDATE Cliente
         SET ClienteNombreFantasia = @1, ClienteApellidoNombre = @2, ClienteFechaAlta= @3, ClienteAdministradorUltNro = @4
         WHERE ClienteId = @0`, [ClienteId, ClienteNombreFantasia, ClienteApellidoNombre, ClienteFechaAlta, ClienteAdministradorId])
    }

    async updateClienteTableforFactura(queryRunner: any, ClienteId: any, ClienteFacturacionId: any) {

        await queryRunner.query(`UPDATE Cliente
         SET ClienteFacturaUltNro = @1
         WHERE ClienteId = @0`, [ClienteId, ClienteFacturacionId])
    }

    async updateAdministradorTable(queryRunner: any, ClienteId: number, ClienteAdministradorId: number, ClienteAdministradorAdministradorId: any) {


        await queryRunner.query(`
         UPDATE ClienteAdministrador
         SET ClienteAdministradorAdministradorId= @2
         WHERE ClienteId = @0 AND ClienteAdministradorId = @1`, [ClienteId, ClienteAdministradorId, ClienteAdministradorAdministradorId])

    }

    async deleteCliente(req: Request, res: Response, next: NextFunction) {

        let { id } = req.query
        const ClienteId = Number(id)
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();


            await queryRunner.query(`DELETE FROM Contacto WHERE ClienteId = @0 `, [ClienteId])
            await queryRunner.query(`DELETE FROM ContactoEmail WHERE ClienteId = @0 `, [ClienteId])
            await queryRunner.query(`DELETE FROM ContactoTelefono WHERE ClienteId = @0 `, [ClienteId])
            await queryRunner.query(`DELETE FROM lige.dbo.docgeneral WHERE cliente_id = @0 AND doctipo_id = 'CLI'`)

            await queryRunner.commitTransaction();

        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }

    }


    async addCliente(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        const ObjCliente = { ...req.body };
        let ObjClienteNew = { ClienteId: 0, infoDomicilio: {}, infoClienteContacto: {}, ClienteFacturacionId: 0 }
        try {
            console.log("ObjCliente ", ObjCliente)
            await this.FormValidations(ObjCliente, queryRunner)
            await queryRunner.startTransaction()

            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)

            //validaciones


            //validacion de barrio
            if (ObjCliente.DomicilioProvinciaId && ObjCliente.DomicilioLocalidadId && !ObjCliente.DomicilioBarrioId) {

                let queryBarrio = await queryRunner.query(`SELECT BarrioId,ProvinciaId,LocalidadId,BarrioDescripcion FROM Barrio WHERE PaisId = 1 AND ProvinciaId = @0 AND LocalidadId = @1`,
                    [ObjCliente.DomicilioProvinciaId, ObjCliente.DomicilioLocalidadId])

                if (queryBarrio && queryBarrio.length > 0)
                    throw new ClientException(`Debe completar el campo barrio.`)

            }

            let ClienteDomicilioUltNro = 1
            let ClienteFacturacionId = 1
            let ClienteDomicilioId = 1

            const ClienteFechaAlta = new Date(ObjCliente.ClienteFechaAlta)
            ClienteFechaAlta.setHours(0, 0, 0, 0)

            let ClienteAdministradorId = ObjCliente.AdministradorId != null && ObjCliente.AdministradorId != "" ? 1 : null

            const ClienteId = await this.insertCliente(queryRunner, ObjCliente.ClienteNombreFantasia, ObjCliente.ClienteApellidoNombre, ClienteFechaAlta, ClienteDomicilioUltNro, ClienteAdministradorId)

            ObjClienteNew.ClienteId = ClienteId
            ObjClienteNew.ClienteFacturacionId = ClienteFacturacionId

            await this.insertClienteFacturacion(queryRunner, ClienteId, ClienteFacturacionId, ObjCliente.ClienteFacturacionCUIT, ObjCliente.CondicionAnteIVAId, ClienteFechaAlta)

            ObjClienteNew.infoDomicilio = await this.ClienteDomicilioUpdate(queryRunner, ObjCliente.infoDomicilio, ClienteId)

            ObjClienteNew.infoClienteContacto = await this.ClienteContactoUpdate(queryRunner, ObjCliente.infoClienteContacto, ClienteId)
            if (ClienteAdministradorId != null) {
                await this.insertClienteAdministrador(queryRunner, ClienteId, ClienteAdministradorId, ObjCliente.ClienteFechaAlta, ObjCliente.AdministradorId)
            }


            if (ObjCliente.files?.length > 0) {

                await FileUploadController.handlePDFUpload(ClienteId, 'Cliente', 'CLI', 'cliente_id', ObjCliente.files, usuario, ip)
            }

            await queryRunner.commitTransaction()
            return this.jsonRes(ObjClienteNew, res, 'Carga  de nuevo registro exitoso');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }


    async insertCliente(queryRunner: any, ClienteNombreFantasia: any, ClienteApellidoNombre: any, ClienteFechaAlta: any, ClienteDomicilioUltNro: any, ClienteAdministradorUltNro: any,
    ) {

        await queryRunner.query(`INSERT INTO Cliente (
            ClienteDenominacion,
            ClienteNombreFantasia,
            ClienteApellidoNombre,
            ClienteFechaAlta,
            ClienteDomicilioUltNro,
            ClienteAdministradorUltNro
            ) VALUES (
            @0,@1,@2,@3,@4,@5
            )`, [
            ClienteApellidoNombre,
            ClienteNombreFantasia,
            ClienteApellidoNombre,
            ClienteFechaAlta,
            ClienteDomicilioUltNro,
            ClienteAdministradorUltNro
        ])

        const ContactoId = await queryRunner.query(`SELECT IDENT_CURRENT('Cliente')`)
        return ContactoId[0]['']
    }

    async insertClienteFacturacion(queryRunner: any, ClienteId: any, ClienteFacturacionId: any, CondicionAnteIVAId: any, ClienteFacturacionCUIT: any, ClienteFechaAlta: Date) {

        await queryRunner.query(`INSERT INTO ClienteFacturacion (
        ClienteId,
        ClienteFacturacionId,
        ClienteFacturacionCUIT,
        CondicionAnteIVAId,
        ClienteFacturacionTipoFactura,
        ClienteFacturacionTipoFacturacion,
        ClienteFacturacionDesde,
        ClienteFacturacionHasta) VALUES (
        @0,@1,@2,@3,@4,@5,@6,@7)`, [ClienteId, ClienteFacturacionId, CondicionAnteIVAId, ClienteFacturacionCUIT, null, null, ClienteFechaAlta, null])
    }

    async inserClientetDomicilioOLD(queryRunner: any, ClienteId: any, ClienteDomicilioId: any, ClienteDomicilioDomLugar: any, ClienteDomicilioDomCalle: any,
        ClienteDomicilioDomNro: any, ClienteDomicilioCodigoPostal: any, ClienteDomicilioProvinciaId: any, ClienteDomicilioLocalidadId: any, ClienteDomicilioBarrioId: any,
    ) {

        await queryRunner.query(`INSERT INTO ClienteDomicilio (
            ClienteId,
            ClienteDomicilioId,
            ClienteDomicilioDomLugar,
            ClienteDomicilioDomCalle,
            ClienteDomicilioDomNro,
            ClienteDomicilioCodigoPostal,
            ClienteDomicilioPaisId,
            ClienteDomicilioProvinciaId,
            ClienteDomicilioLocalidadId,
            ClienteDomicilioBarrioId,
            ClienteDomicilioActual) VALUES ( @0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10
            )`, [ClienteId,
            ClienteDomicilioId,
            ClienteDomicilioDomLugar,
            ClienteDomicilioDomCalle,
            ClienteDomicilioDomNro,
            ClienteDomicilioCodigoPostal,
            1,
            ClienteDomicilioProvinciaId,
            ClienteDomicilioLocalidadId,
            ClienteDomicilioBarrioId,
            1
        ])
    }


    async insertClienteAdministrador(queryRunner: any, ClienteId: number, ClienteAdministradorId: number, ClienteFechaAlta: Date, ClienteAdministradorAdministradorId: number) {

        await queryRunner.query(` INSERT INTO ClienteAdministrador (
                ClienteId,
                ClienteAdministradorId,
                ClienteAdministradorDesde,
                ClienteAdministradorHasta,
                ClienteAdministradorAdministradorId
                ) VALUES ( @0,@1,@2,@3,@4
                )`, [ClienteId, ClienteAdministradorId, ClienteFechaAlta, null, ClienteAdministradorAdministradorId])


    }

    async DeleteClienteAdministrador(queryRunner: any, ObjCliente: any, ClienteId: number) {


        await queryRunner.query(` DELETE FROM ClienteAdministrador 
                WHERE ClienteId=@0 AND ClienteAdministradorId=@1 `, [ClienteId, ObjCliente.ClienteAdministradorUltNro])

    }

    async insertAdministrador(queryRunner: any, AdministradorApellido: any,
        AdministradorNombre: any, AdministradorDenominacion: any,
        AdministradorNombreFantasia: any,) {

        let AdministradorApellidoNombre =
            (AdministradorApellido ? AdministradorApellido : '') +
            (AdministradorApellido && AdministradorNombre ? ',' : '') +
            (AdministradorNombre ? AdministradorNombre : '') || AdministradorDenominacion;

        await queryRunner.query(` INSERT INTO Administrador (
                AdministradorApellido,
                AdministradorNombre,
                AdministradorDenominacion,
                AdministradorNombreFantasia,
                AdministradorApellidoNombre,
                AdministradorSexo,
                AdministradorInactivo,
                AdministradorContactoUltNro,
                AdministradorTelefonoUltNro,
                AdministradorEmailUltNro,
                AdministradorPaginaWebUltNro,
                AdministradorDomicilioUltNro,
                AdministradorFacturacionUltNro,
                AdministradorSucursalId,
                AdministradorImagenId
                ) VALUES ( @0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13,@14
                )`, [AdministradorApellido, AdministradorNombre, AdministradorDenominacion,
            AdministradorNombreFantasia, AdministradorApellidoNombre, null, null, null, null, null, null, null, null, null, null])

    }

    async FormValidations(form: any, queryRunner: any) {
        const CUIT: number = form.ClienteFacturacionCUIT
        const idCliente: number = form.id
     
        let valCuit = await queryRunner.query(`SELECT * FROM ClienteFacturacion WHERE ClienteFacturacionCUIT = @0`, [CUIT])
        console.log("valCuit ", valCuit)

        if (valCuit.length > 0 && idCliente != valCuit[0].ClienteId) {
            throw new ClientException(`El CUIT ingresado ya existe`);

        }


        if (!form.ClienteFacturacionCUIT) {
            throw new ClientException(`Debe completar el campo CUIT.`)
        }

        if (!form.ClienteFechaAlta) {
            throw new ClientException(`Debe completar el campo Fecha Inicial.`)
        }

        if (!form.ClienteNombreFantasia) {
            throw new ClientException(`Debe completar el campo Nombre Fantasia.`)
        }

        if (!form.CondicionAnteIVAId) {
            throw new ClientException(`Debe completar el campo Condición ante IVA.`)
        }

        if (!form.ClienteApellidoNombre) {
            throw new ClientException(`Debe completar el campo Razón Social.`)
        }



        for (const obj of form.infoDomicilio) {

            //Domicilio

            if (!obj.ClienteDomicilioDomCalle) {
                throw new ClientException(`Debe completar el campo Dirección Calle.`)
            }

            if (!obj.ClienteDomicilioDomNro) {
                throw new ClientException(`Debe completar el campo Domicilio Nro.`)
            }

            if (obj.ClienteDomicilioDomNro.length > 5) {
                throw new ClientException(`Debe completar el campo Domicilio Nro.`)
            }

            if (!obj.ClienteDomicilioCodigoPostal) {
                throw new ClientException(`Debe completar el campo Cod Postal.`)
            }

            if (obj.ClienteDomicilioCodigoPostal.length > 8) {
                throw new ClientException(`El campo Cod Postal NO puede ser mayor a 8 digitos.`)
            }

            if (!obj.ClienteDomicilioProvinciaId) {
                throw new ClientException(`Debe completar el campo Provincia.`)
            }

            if (!obj.ClienteDomicilioLocalidadId) {
                throw new ClientException(`Debe completar el campo Localidad.`)
            }


        }

        // CLIENTE CONTACTO

        for (const obj of form.infoClienteContacto) {

            if (!obj.nombre) {
                throw new ClientException(`Debe completar el campo Nombre en cliente contacto`)
            }

            if (!obj.ContactoApellido) {
                throw new ClientException(`Debe completar el campo Apellido en cliente contacto`)
            }

            if (obj.telefono && !obj.TipoTelefonoId) {
                throw new ClientException(`Debe completar el campo Tipo Telefono`)
            }

        }


    }


}
