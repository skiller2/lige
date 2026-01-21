import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL,getOptionsSINO } from "../impuestos-afip/filtros-utils/filtros";
import { QueryRunner, QueryResult } from "typeorm";
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
            searchComponent: "inputForClientSearch",
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
            searchHidden: false,
            minWidth: 100,
            maxWidth: 100
        },
        {
            name: "Razón Social",
            type: "string",
            id: "ClienteDenominacion",
            field: "ClienteDenominacion",
            fieldName: "cli.ClienteDenominacion",
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
            fieldName: "inputForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        },

        {
            name: "Domicilio",
            type: "string",
            id: "Domicilio",
            field: "Domicilio",
            fieldName: "domcli.DomicilioDomCalle",
            sortable: true,
            searchHidden: true
        },
        {
            name: "Correo Notificación",
            type: "string",
            id: "ContactoEmailEmail",
            field: "ContactoEmailEmail",
            fieldName: "correonoti.ContactoEmailEmail",
            sortable: true,
            searchHidden: true
        },

        {
            name: "Cantidad Objetivos activos",
            type: "number",
            id: "CantidadObjetivos",
            field: "CantidadObjetivos",
            fieldName: "cant.CantidadObjetivos",
            sortable: true,
            hidden: false,
            searchHidden: false,
            maxWidth: 130
        },
        {
            name: "Cantidad Custodias (30 días)",
            type: "number",
            id: "CantidadCustodias",
            field: "CantidadCustodias",
            fieldName: "custodias.CantidadCustodias",
            sortable: true,
            hidden: false,
            searchHidden: false,
            maxWidth: 140
        },
        {
            name: "Activo",
            id: "activo",
            field: "activo",
            fieldName: "calc.activo",
            type: 'string',
            searchComponent: "inputForActivo",

            sortable: true,

            formatter: 'collectionFormatter',
            params: { collection: getOptionsSINO },

            exportWithFormatter: true,
            hidden: false,
            searchHidden: false,
            minWidth: 50,
            maxWidth: 50,
            cssClass:'text-center'
        },
    ];

    listDocsColumns: any[] = [
        {
            id: "id",
            name: "Id",
            field: "id",
            fieldName: "doc.DocumentoId",
            type: "number",
            sortable: false,
            hidden: false,
            searchHidden: false,
            maxWidth: 150,

        },
        {
            name: "Denominación",
            type: "string",
            id: "DocumentoDenominadorDocumento",
            field: "DocumentoDenominadorDocumento",
            fieldName: "doc.DocumentoDenominadorDocumento",
            sortable: true,
            hidden: false,
            searchHidden: false,
            // maxWidth: 500,
        },
        {
            name: "Tipo",
            type: "string",
            id: "DocumentoTipoCodigo",
            field: "DocumentoTipoCodigo",
            fieldName: "doc.DocumentoTipoCodigo",
            sortable: true,
            hidden: true,
            searchHidden: false,
            // maxWidth: 500,
        },
        {
            name: "Tipo",
            type: "string",
            id: "Descripcion",
            field: "Descripcion",
            fieldName: "param.DocumentoTipoDetalle",
            sortable: true,
            hidden: false,
            searchHidden: true,
            // maxWidth: 200,
        },
        {
            name: "Desde",
            type: "date",
            id: "Desde",
            field: "doc.DocumentoFecha",
            fieldName: "doc.DocumentoFecha",
            searchComponent: "inputForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Hasta",
            type: "date",
            id: "Hasta",
            field: "Hasta",
            fieldName: "doc.DocumentoFechaDocumentoVencimiento",
            searchComponent: "inputForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
    ];

    optionsJurImpositiva: any[] = [
        {
            value: 'Arba',
            label: 'Arba'
        },
        {
            value: 'Agip',
            label: 'Agip'
        },
        {
            value: 'Formosa',
            label: 'Formosa'
        },
    ];

    async getGridCols(req, res) {
        this.jsonRes(this.listaColumnas, res);
    }

    async getDocsGridCols(req, res) {
        this.jsonRes(this.listDocsColumns, res);
    }


    validarCUIT(cuit: string): boolean {
        const cleanCUIT = String(cuit).replace(/[-\s]/g, '');

        if (!/^\d{11}$/.test(cleanCUIT)) return false;

        const digits = cleanCUIT.split('').map(Number);
        const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

        const sum = multipliers.reduce((acc, mult, i) => acc + digits[i] * mult, 0);
        let checkDigit = 11 - (sum % 11);

        if (checkDigit === 11) checkDigit = 0;
        else if (checkDigit === 10) checkDigit = 9;

        return checkDigit === digits[10];
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
        cli.ClienteDenominacion, 
        cli.ClienteNombreFantasia, 
        cli.ClienteFechaAlta,
        CONCAT_WS(' ', 
            TRIM(domcli.DomicilioDomCalle), 
            TRIM(domcli.DomicilioDomNro)
        ) AS Domicilio,
        cant.CantidadObjetivos,
        custodias.CantidadCustodias,
        correonoti.ContactoEmailEmail,
        calc.activo
    FROM 
        Cliente cli
        LEFT JOIN ClienteFacturacion fac ON fac.ClienteId = cli.ClienteId 
            AND fac.ClienteFacturacionDesde <= @0 
            AND ISNULL(fac.ClienteFacturacionHasta, '9999-12-31') >= @0
        LEFT JOIN CondicionAnteIVA con ON con.CondicionAnteIVAId = fac.CondicionAnteIVAId

        LEFT JOIN (

            SELECT ct.ClienteId, STRING_AGG(mail.ContactoEmailEmail, ', ') ContactoEmailEmail
		  	FROM Contacto ct 
            JOIN ContactoEmail mail ON mail.ContactoId = ct.ContactoId AND (mail.ContactoEmailInactivo IS NULL OR mail.ContactoEmailInactivo =0)
            WHERE ct.ClienteElementoDependienteId IS NULL AND  mail.ContactoEmailEmail IS NOT NULL AND (mail.ContactoEmailInactivo IS NULL OR mail.ContactoEmailInactivo=0) AND (ct.ContactoInactivo IS NULL OR ct.ContactoInactivo=0)  AND ct.ContactoTipoCod = 'NOTI'
            GROUP BY ct.ClienteId
        ) correonoti ON correonoti.ClienteId = cli.ClienteId

        LEFT JOIN (
          SELECT cus.cliente_id ClienteId, COUNT(*) CantidadCustodias FROM lige.dbo.objetivocustodia cus
          WHERE DATEDIFF(day, cus.fecha_inicio, @0)< 30
          GROUP BY cus.cliente_id
        ) custodias ON custodias.ClienteId = cli.ClienteId


        LEFT JOIN (
            SELECT 
                domcli.ClienteId, 
                 dom.DomicilioDomCalle, 
                 dom.DomicilioDomNro
            FROM 
                NexoDomicilio domcli
                JOIN Domicilio dom ON dom.DomicilioId = domcli.DomicilioId
            WHERE 
                domcli.NexoDomicilioActual = 1 AND domcli.ClienteId IS NOT NULL
            AND domcli.DomicilioId = (
                SELECT MAX(DomicilioId) 
                FROM NexoDomicilio 
                WHERE ClienteId = domcli.ClienteId AND ClienteElementoDependienteId IS NULL
                AND NexoDomicilioActual = 1
            )        ) AS domcli ON domcli.ClienteId = cli.ClienteId
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
CROSS APPLY
    (SELECT (IIF(cant.CantidadObjetivos>0 OR custodias.CantidadCustodias>0,'1','0')) AS activo) AS calc

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

    async listDocsCliente(req: any, res: Response, next: NextFunction) {

        const filterSql = filtrosToSql(req.body.options.filtros, this.listDocsColumns);
        const orderBy = orderToSQL(req.body.options.sort);
        const ClienteId = req.body.ClienteId;
        const queryRunner = dataSource.createQueryRunner();

        try {
            const documentos = await queryRunner.query(
            `SELECT doc.DocumentoId AS id, doc.DocumentoDenominadorDocumento, doc.DocumentoFecha Desde, doc.DocumentoFechaDocumentoVencimiento Hasta,CONCAT(doc.DocumentoMes, '/', doc.DocumentoAnio) periodo,
                param.DocumentoTipoCodigo Parametro, param.DocumentoTipoDetalle Descripcion,
                CONCAT('api/file-upload/downloadFile/', doc.DocumentoId, '/Documento/0') url,
                RIGHT(doc.DocumentoNombreArchivo, CHARINDEX('.', REVERSE(doc.DocumentoNombreArchivo)) - 1) TipoArchivo,
                1
            FROM Documento doc
            LEFT JOIN DocumentoTipo param ON param.DocumentoTipoCodigo = doc.DocumentoTipoCodigo
            WHERE doc.DocumentoClienteId = @0 AND doc.ObjetivoId IS NULL
                AND ${filterSql}`, [ClienteId])

            this.jsonRes(
                {
                    total: documentos.length,
                    list: documentos,
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
                 dom.DomicilioId
                ,TRIM(dom.DomicilioDomCalle) AS DomicilioDomCalle
                ,TRIM(dom.DomicilioDomNro) AS DomicilioDomNro
                ,TRIM(dom.DomicilioCodigoPostal) AS DomicilioCodigoPostal
                ,dom.DomicilioPaisId AS domiciliopais
                ,dom.DomicilioProvinciaId
                ,dom.DomicilioLocalidadId
                ,dom.DomicilioBarrioId
                ,TRIM(dom.DomicilioDomLugar) AS DomicilioDomLugar
            FROM Domicilio AS dom
            JOIN NexoDomicilio nex ON nex.DomicilioId =dom.DomicilioId
            WHERE nex.ClienteId = @0 AND nex.ClienteElementoDependienteId IS NULL
                AND nex.NexoDomicilioActual = 1
            ORDER BY dom.DomicilioId DESC `, [clienteId])
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
            cce.ContactoEmailId,
            cc.ContactoTipoCod,
            cc.ContactoJurImpositiva
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
            ,TRIM(cli.ClienteDenominacion) AS ClienteDenominacion 
            ,TRIM(cli.ClienteNombreFantasia) AS ClienteNombreFantasia
            ,cli.ClienteFechaAlta
            ,cli.ClienteTerminoPago
            ,cli.ClienteAdministradorUltNro
            ,TRIM(adm.AdministradorNombre) AS AdministradorNombre
            ,TRIM(adm.AdministradorApellido) AS AdministradorApellido
            ,adm.AdministradorId

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
        WHERE cli.ClienteId = @0
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
            const tipoTelefono = await queryRunner.query(`SELECT TipoTelefonoId, TipoTelefonoDescripcion FROM TipoTelefono`)
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

    async getTipoContacto(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            const optionsContactoTipo = await queryRunner.query(`
                SELECT ContactoTipoCod value, Descripcion label FROM ContactoTipo`
            )
            return this.jsonRes(optionsContactoTipo, res);
        } catch (error) {
            return next(error)
        } finally {
        }
    }

    async getJurImpositiva(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            return this.jsonRes(this.optionsJurImpositiva, res);
        } catch (error) {
            return next(error)
        } finally {
        }
    }

    async getQueryCliente(queryRunner: any, clienteId: any) {
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

        return infoCliente
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
            await this.updateClienteTable(queryRunner, ClienteId, ObjCliente.ClienteNombreFantasia, ObjCliente.ClienteDenominacion, ClienteFechaAlta, ClienteAdministradorId, ObjCliente.ClienteTerminoPago);

            //se actualiza lo relacionado a cliente facturacion
            const ClienteFacturacionId = await this.ClienteFacturacion(queryRunner, ObjCliente, ClienteId)
            ObjCliente.ClienteFacturacionId = ClienteFacturacionId


            ObjClienteNew.infoDomicilio = await this.ClienteDomicilioUpdate(queryRunner, ObjCliente.infoDomicilio, ClienteId)

            ObjClienteNew.infoClienteContacto = await this.ClienteContactoUpdate(queryRunner, ObjCliente.infoClienteContacto, ClienteId)

            // inser y update cliente contacto
            //ObjClienteNew = await this.ClienteContacto(queryRunner,ObjCliente,ClienteId)


            if (ObjCliente.files?.length > 0) {
                for (const file of ObjCliente.files) {
                    await FileUploadController.handleDOCUpload(null, null, ClienteId, null, new Date(), null, ObjCliente.ClienteFacturacionCUIT, null, null, file, usuario, ip, queryRunner)
                }
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
        const DomicilioIds = domicilios.map((row: { DomicilioId: any; }) => row.DomicilioId).filter((id) => id !== null && id !== undefined);

        if (DomicilioIds.length > 0) {
            await queryRunner.query(`DELETE FROM NexoDomicilio WHERE ClienteId = @0 AND DomicilioId NOT IN (${DomicilioIds.join(',')}) AND ClienteElementoDependienteId IS NULL`, [ClienteId])
            await queryRunner.query(`DELETE dom FROM Domicilio dom  JOIN NexoDomicilio nex ON nex.DomicilioId=dom.DomicilioId AND nex.ClienteId=@0 WHERE nex.ClienteElementoDependienteId IS NULL and dom.DomicilioId NOT IN(${DomicilioIds.join(',')})`, [ClienteId])
        }

        for (const [idx, domicilio] of domicilios.entries()) {
            if (domicilio.DomicilioId) {
                await queryRunner.query(`UPDATE Domicilio
                    SET DomicilioDomCalle = @2,DomicilioDomNro = @3, DomicilioCodigoPostal = @4, 
                    DomicilioProvinciaId = @5,DomicilioLocalidadId = @6,DomicilioBarrioId = @7,DomicilioDomLugar=@8
                    WHERE DomicilioId = @0`, [
                    domicilio.DomicilioId, null, domicilio.DomicilioDomCalle, domicilio.DomicilioDomNro, domicilio.DomicilioCodigoPostal,
                    domicilio.DomicilioProvinciaId, domicilio.DomicilioLocalidadId, domicilio.DomicilioBarrioId, domicilio.DomicilioDomLugar])
            } else {

                //Agregar nexo tambien
                await queryRunner.query(`INSERT INTO Domicilio (
                    DomicilioDomLugar, DomicilioDomCalle, DomicilioDomNro, DomicilioCodigoPostal, 
                    DomicilioPaisId, DomicilioProvinciaId, DomicilioLocalidadId, DomicilioBarrioId) 
                    VALUES ( @0,@1,@2,@3,@4,@5,@6,@7)`, [
                    domicilio.DomicilioDomLugar, domicilio.DomicilioDomCalle, domicilio.DomicilioDomNro,
                    domicilio.DomicilioCodigoPostal, 1, domicilio.DomicilioProvinciaId, domicilio.DomicilioLocalidadId,
                    domicilio.DomicilioBarrioId
                ])
                const resDomicilio = await queryRunner.query(`SELECT IDENT_CURRENT('Domicilio')`)
                domicilios[idx].DomicilioId = resDomicilio[0]['']

                await queryRunner.query(`INSERT INTO NexoDomicilio (
                    DomicilioId, NexoDomicilioActual, NexoDomicilioComercial, NexoDomicilioOperativo, NexoDomicilioConstituido, NexoDomicilioLegal, ClienteId
                    ) 
                    VALUES ( @0,@1,@2,@3,@4,@5,@6)`, [
                    domicilios[idx].DomicilioId, 1, 1, 1, 1, 1, ClienteId
                ])



            }
        }
        return domicilios
    }

    async ClienteContactoUpdate(queryRunner: any, contactos: any, ClienteId: number) {
        const ContactoIds = contactos.map((row: { ContactoId: any; }) => row.ContactoId).filter((id) => id !== null && id !== undefined);
        if (ContactoIds.length > 0) {
            await queryRunner.query(`DELETE e FROM ContactoEmail e
                JOIN Contacto c ON c.ContactoId = e.ContactoId
                WHERE c.ClienteId = @0 AND e.ContactoId NOT IN (${ContactoIds.join(',')}) `, [ClienteId])
            await queryRunner.query(`DELETE t FROM ContactoTelefono t 
                JOIN Contacto c ON c.ContactoId = t.ContactoId
                WHERE c.ClienteId = @0 AND t.ContactoId NOT IN (${ContactoIds.join(',')}) `, [ClienteId])
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
                await queryRunner.query(`UPDATE Contacto SET  ContactoArea=@1,ContactoApellido=@2,ContactoNombre=@3,ContactoApellidoNombre=@4,ContactoTipoCod=@5,ContactoJurImpositiva=@6 WHERE ContactoId=@0 `,
                    [contacto.ContactoId, contacto.area, contacto.ContactoApellido, contacto.nombre, ContactoApellidoNombre, contacto.ContactoTipoCod, contacto.ContactoJurImpositiva])
            } else { //Nuevo contacto
                await queryRunner.query(`INSERT INTO Contacto (ClienteId,ContactoArea,ContactoApellido,ContactoNombre,ContactoTelefonoUltNro,ContactoEmailUltNro,ContactoApellidoNombre,ContactoTipoCod,ContactoJurImpositiva )
                    VALUES ( @0,@1,@2,@3,@4,@5,@6,@7,@8)`, [
                    ClienteId, contacto.area, contacto.ContactoApellido, contacto.nombre, ContactoTelefonoUltNro, ContactoEmailUltNro, ContactoApellidoNombre, contacto.ContactoTipoCod, contacto.ContactoJurImpositiva])
                const resContacto = await queryRunner.query(`SELECT IDENT_CURRENT('Contacto')`)
                ContactoId = resContacto[0][''];
                contactos[idx].ContactoId = ContactoId
            }

            if (contacto.correo)
                await queryRunner.query(`INSERT INTO ContactoEmail (ContactoEmailId,ContactoId,ContactoEmailEmail,ContactoEmailInactivo) VALUES (
                @0,@1,@2,@3)`, [++ContactoEmailUltNro, ContactoId, contacto.correo, false])

            if (contacto.telefono)
                await queryRunner.query(`INSERT INTO ContactoTelefono (ContactoTelefonoId,ContactoId,TipoTelefonoId,ContactoTelefonoNro) 
                  VALUES (@0,@1,@2,@3)`, [++ContactoTelefonoUltNro, contacto.ContactoId, contacto.TipoTelefonoId, contacto.telefono])
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

    async ClienteFacturacion(queryRunner: any, ObjCliente: any, ClienteId: any) {

        let ClienteFacturacionId
        if (ObjCliente.ClienteFacturacionId) {
            ClienteFacturacionId = ObjCliente.ClienteFacturacionId
            await this.updateFacturaTable(queryRunner, ClienteId, ObjCliente.ClienteFacturacionId, ObjCliente.ClienteFacturacionCUIT, ObjCliente.CondicionAnteIVAId);
        } else {
            ClienteFacturacionId = 1;
            await this.insertClienteFacturacion(queryRunner, ClienteId, ClienteFacturacionId, ObjCliente.ClienteFacturacionCUIT, ObjCliente.CondicionAnteIVAId);
            await this.updateClienteTableforFactura(queryRunner, ClienteId, ClienteFacturacionId);
        }

        return ClienteFacturacionId
    }

    async updateFacturaTable(queryRunner: any, ClienteId: number, ClienteFacturacionId: string, ClienteFacturacionCUIT: string, CondicionAnteIVAId: number) {


        await queryRunner.query(`UPDATE ClienteFacturacion
        SET ClienteFacturacionCUIT = @2,CondicionAnteIVAId = @3
        WHERE ClienteId = @0 AND ClienteFacturacionId = @1`, [ClienteId, ClienteFacturacionId, ClienteFacturacionCUIT, CondicionAnteIVAId])
    }


    async updateClienteTable(queryRunner: any, ClienteId: number, ClienteNombreFantasia: string, ClienteDenominacion: string, ClienteFechaAlta: Date, ClienteAdministradorId: any, ClienteTerminoPago: any,) {

        await queryRunner.query(`UPDATE Cliente
         SET ClienteNombreFantasia = @1, ClienteApellidoNombre = @2, ClienteDenominacion = @2, ClienteFechaAlta= @3, ClienteAdministradorUltNro = @4, ClienteTerminoPago=@5
         WHERE ClienteId = @0`, [ClienteId, ClienteNombreFantasia, ClienteDenominacion, ClienteFechaAlta, ClienteAdministradorId, ClienteTerminoPago])
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
            throw new ClientException(`Función en desarrollo.`)
            const contactosIds = await queryRunner.query(`SELECT ContactoId, ClienteId FROM Contacto WHERE ClienteId = @0 `, [ClienteId])

            for (const contacto of contactosIds) {
                await queryRunner.query(`DELETE FROM ContactoEmail WHERE ClienteId = @0 `, [contacto.ContactoId])
                await queryRunner.query(`DELETE FROM ContactoTelefono WHERE ClienteId = @0 `, [contacto.ContactoId])
            }
            await queryRunner.query(`DELETE FROM Contacto WHERE ClienteId = @0 `, [ClienteId])

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

            let ClienteFacturacionId = 1

            const ClienteFechaAlta = new Date(ObjCliente.ClienteFechaAlta)
            ClienteFechaAlta.setHours(0, 0, 0, 0)



            let ClienteAdministradorId = ObjCliente.AdministradorId != null && ObjCliente.AdministradorId != "" ? 1 : null

            const ClienteId = await this.insertCliente(queryRunner, ObjCliente.ClienteNombreFantasia, ObjCliente.ClienteDenominacion, ClienteFechaAlta, ClienteAdministradorId, ObjCliente.ClienteTerminoPago)

            ObjClienteNew.ClienteId = ClienteId
            ObjClienteNew.ClienteFacturacionId = ClienteFacturacionId

            await this.insertClienteFacturacion(queryRunner, ClienteId, ClienteFacturacionId, ObjCliente.ClienteFacturacionCUIT, ObjCliente.CondicionAnteIVAId)

            ObjClienteNew.infoDomicilio = await this.ClienteDomicilioUpdate(queryRunner, ObjCliente.infoDomicilio, ClienteId)

            ObjClienteNew.infoClienteContacto = await this.ClienteContactoUpdate(queryRunner, ObjCliente.infoClienteContacto, ClienteId)
            if (ClienteAdministradorId != null) {
                await this.insertClienteAdministrador(queryRunner, ClienteId, ClienteAdministradorId, ObjCliente.ClienteFechaAlta, ObjCliente.AdministradorId)
            }


            if (ObjCliente.files?.length > 0) {
                for (const file of ObjCliente.files) {
                    await FileUploadController.handleDOCUpload(null, null, ClienteId, null, new Date(), null, ObjCliente.ClienteFacturacionCUIT, null, null, file, usuario, ip, queryRunner)
                }
            }

            let ObjClienteNewQuery = await this.getQueryCliente(queryRunner, ClienteId)

            await queryRunner.commitTransaction()
            return this.jsonRes(ObjClienteNewQuery, res, 'Carga  de nuevo registro exitoso');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }


    async insertCliente(queryRunner: any, ClienteNombreFantasia: any, ClienteDenominacion: any, ClienteFechaAlta: any, ClienteAdministradorUltNro: any, ClienteTerminoPago: any,
    ) {

        await queryRunner.query(`INSERT INTO Cliente (
            ClienteDenominacion,
            ClienteNombreFantasia,
            ClienteApellidoNombre,
            ClienteFechaAlta,
            ClienteAdministradorUltNro,
            ClienteTerminoPago
            ) VALUES (
            @0,@1,@2,@3,@4,@5
            )`, [
            ClienteDenominacion,
            ClienteNombreFantasia,
            ClienteDenominacion,
            ClienteFechaAlta,
            ClienteAdministradorUltNro,
            ClienteTerminoPago
        ])

        const ContactoId = await queryRunner.query(`SELECT IDENT_CURRENT('Cliente')`)
        return ContactoId[0]['']
    }

    async insertClienteFacturacion(queryRunner: any, ClienteId: any, ClienteFacturacionId: any, CondicionAnteIVAId: any, ClienteFacturacionCUIT: any) {
        let FechaActual = new Date()

        await queryRunner.query(`INSERT INTO ClienteFacturacion (
        ClienteId,
        ClienteFacturacionId,
        ClienteFacturacionCUIT,
        CondicionAnteIVAId,
        ClienteFacturacionTipoFactura,
        ClienteFacturacionTipoFacturacion,
        ClienteFacturacionDesde,
        ClienteFacturacionHasta) VALUES (
        @0,@1,@2,@3,@4,@5,@6,@7)`, [ClienteId, ClienteFacturacionId, CondicionAnteIVAId, ClienteFacturacionCUIT, null, null, FechaActual, null])
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
        const CUIT: string = form.ClienteFacturacionCUIT;
        const idCliente: number = form.id;

        if (!CUIT) {
            throw new ClientException(`Debe completar el campo CUIT.`);
        }

        if (!/^\d{11}$/.test(CUIT)) {
            throw new ClientException(`El CUIT debe contener exactamente 11 dígitos numéricos.`);
        }

        const valCuit = await queryRunner.query(
            `SELECT ClienteId FROM ClienteFacturacion WHERE ClienteFacturacionCUIT = @0`, [CUIT]
        );

        if (valCuit.length > 0 && idCliente !== valCuit[0].ClienteId) {
            throw new ClientException(`El CUIT ingresado ya existe.`);
        }

        if (!this.validarCUIT(CUIT)) {
            throw new ClientException(`El Nro de CUIT no pasa el control de integridad, verifique el dato`);
        }


        if (!form.ClienteFechaAlta) {
            throw new ClientException(`Debe completar el campo Fecha Inicial.`);
        }

        if (!form.ClienteNombreFantasia) {
            throw new ClientException(`Debe completar el campo Nombre Fantasia.`);
        }

        if (!form.ClienteTerminoPago) {
            throw new ClientException(`Debe completar el campo Termino Pago.`);
        }

        if (!form.CondicionAnteIVAId) {
            throw new ClientException(`Debe completar el campo Condición ante IVA.`);
        }

        if (!form.ClienteDenominacion) {
            throw new ClientException(`Debe completar el campo Razón Social.`);
        }



        for (const obj of form.infoDomicilio) {

            //Domicilio

            if (!obj.DomicilioDomCalle) {
                throw new ClientException(`Debe completar el campo Dirección Calle.`)
            }

            if (!obj.DomicilioDomNro) {
                throw new ClientException(`Debe completar el campo Domicilio Nro.`)
            }

            if (obj.DomicilioDomNro.length > 5) {
                throw new ClientException(`Debe completar el campo Domicilio Nro.`)
            }

            if (!obj.DomicilioCodigoPostal) {
                throw new ClientException(`Debe completar el campo Cod Postal.`)
            }

            if (obj.DomicilioCodigoPostal.length > 8) {
                throw new ClientException(`El campo Cod Postal NO puede ser mayor a 8 digitos.`)
            }

            if (!obj.DomicilioProvinciaId) {
                throw new ClientException(`Debe completar el campo Provincia.`)
            }

            if (!obj.DomicilioLocalidadId) {
                throw new ClientException(`Debe completar el campo Localidad.`)
            }


        }

        // CLIENTE CONTACTO

        for (const obj of form.infoClienteContacto) {

            if (!obj.ContactoTipoCod) {
                throw new ClientException(`Debe completar el campo Tipo de contacto en cliente contacto`)
            }

            if (!obj.ContactoJurImpositiva) {
                throw new ClientException(`Debe completar el campo Jurisdicción impositiva en cliente contacto`)
            }

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

    static async AddContactosMigrados() {
        const queryRunner = dataSource.createQueryRunner();
        const contactos = await queryRunner.query(`SELECT DISTINCT fac.ClienteId, 'Entrega Comprobante' ContactoApellido, mig.jurisdiccion_Impositiva ContactoNombre,  REPLACE(mig.correo,';',',') correo, mig.jurisdiccion_Impositiva ContactoJurImpositiva
            FROM migrarcontactos mig 
            JOIN ClienteFacturacion fac  ON fac.ClienteFacturacionCUIT= mig.numero_identificacion
            WHERE mig.is_company != 'true'
        `)
        await queryRunner.startTransaction()

        for (const contacto of contactos) {
            console.log('update contacto', contacto)
            await ClientesController.CreateContactosMigrados(contacto.ClienteId, 'Entrega', contacto.ContactoApellido, contacto.ContactoNombre, contacto.ContactoJurImpositiva, contacto.correo, queryRunner)
        }

        await queryRunner.rollbackTransaction()
        //        await queryRunner.commitTransaction()


    }


    static async CreateContactosMigrados(ClienteId: number, area: string, ContactoApellido: string, ContactoNombre: string, ContactoJurImpositiva: string, correo: string, queryRunner: QueryRunner) {
        let ContactoTelefonoUltNro = 0, ContactoEmailUltNro = 0
        const ContactoApellidoNombre = `${ContactoApellido} ${ContactoNombre}`
        await queryRunner.query(`INSERT INTO Contacto (ClienteId,ContactoArea,ContactoApellido,ContactoNombre,ContactoTelefonoUltNro,ContactoEmailUltNro,ContactoApellidoNombre,ContactoJurImpositiva )
            VALUES ( @0,@1,@2,@3,@4,@5,@6,@7)`, [
            ClienteId, area, ContactoApellido, ContactoNombre, ContactoTelefonoUltNro, ContactoEmailUltNro, ContactoApellidoNombre, ContactoJurImpositiva])
        const resContacto = await queryRunner.query(`SELECT IDENT_CURRENT('Contacto')`)
        const ContactoId = resContacto[0][''];

        if (correo)
            await queryRunner.query(`INSERT INTO ContactoEmail (ContactoEmailId,ContactoId,ContactoEmailEmail,ContactoEmailInactivo) VALUES (
        @0,@1,@2,@3)`, [++ContactoEmailUltNro, ContactoId, correo, false])

        await queryRunner.query(`UPDATE Contacto SET ContactoTelefonoUltNro=@1,ContactoEmailUltNro=@2  WHERE ContactoId=@0 `,
            [ContactoId, ContactoTelefonoUltNro, ContactoEmailUltNro])


    }

    async getOptions(req, res) {
        this.jsonRes(getOptionsSINO, res);
    }

}
