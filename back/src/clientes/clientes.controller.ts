import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { QueryResult } from "typeorm";
import { FileUploadController } from "../controller/file-upload.controller"


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
            name: "CUIT",
            type: "number",
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
            id: "CLienteNombreFantasia",
            field: "CLienteNombreFantasia",
            fieldName: "cli.CLienteNombreFantasia",
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
        cli.CLienteNombreFantasia, 
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
    LEFT JOIN ClienteContrato clicon ON clicon.ClienteId = cli.ClienteId AND obj.ClienteElementoDependienteId IS NULL 
    AND @0 >= clicon.ClienteContratoFechaDesde AND ISNuLL(clicon.ClienteContratoFechaHasta,'9999-12-31') >= @0 AND ISNuLL(clicon.ClienteContratoFechaFinalizacion,'9999-12-31') >= @0

        
        
    WHERE 
      ISNULL(eledepcon.ClienteElementoDependienteContratoFechaDesde,clicon.ClienteContratoFechaDesde) IS NOT NULL
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

            infoCliente = infoCliente[0]
            infoCliente.infoClienteContacto = infoClienteContacto

            await queryRunner.commitTransaction()
            return this.jsonRes(infoCliente, res)
        } catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async getClienteContactoQuery(queryRunner: any, clienteId: any) {
        return await queryRunner.query(`
        SELECT 
            TRIM(cc.ContactoNombre) AS nombre,
            cc.ContactoId,
            TRIM(cc.ContactoApellido) AS ContactoApellido,
            cc.ContactoArea AS area,
            cc.ContactoEmailUltNro,
            cc.ContactoTelefonoUltNro,
            cct.TipoTelefonoId,
            cct.ContactoTelefonoCodigoArea,
            cct.ContactoTelefonoId,
            TRIM(cce.ContactoEmailEmail) AS correo ,
            TRIM(cct.ContactoTelefonoNro) AS telefono,
            cce.ContactoEmailId
        FROM  Contacto cc
        LEFT JOIN ContactoEmail cce ON 
            cc.ContactoId = cce.ContactoId
            AND cc.ContactoEmailUltNro = cce.ContactoEmailId
        LEFT JOIN ContactoTelefono cct ON 
            cc.ContactoId = cct.ContactoId
            AND cc.ContactoTelefonoUltNro = cct.ContactoTelefonoId
        WHERE  cc.ClienteId= @0`,
            [clienteId])
    }


    async getObjetivoClienteQuery(queryRunner: any, clienteId: any) {
        const fechaActual = new Date()
        const anio = fechaActual.getFullYear()
        const mes = fechaActual.getMonth()+1
        return await queryRunner.query(`SELECT cli.ClienteId AS id
            ,cli.ClienteId
            ,fac.ClienteFacturacionCUIT
            ,fac.ClienteFacturacionId
            ,fac.CondicionAnteIVAId
            ,TRIM(con.CondicionAnteIVADescripcion) AS CondicionAnteIVADescripcion
            ,TRIM(cli.ClienteApellidoNombre) AS ClienteApellidoNombre 
            ,TRIM(cli.CLienteNombreFantasia) AS CLienteNombreFantasia
            ,cli.ClienteFechaAlta
            ,cli.ClienteAdministradorUltNro
            ,cli.ClienteTelefonoUltNro
            ,cli.ClienteEmailUltNro
            ,domcli.ClienteDomicilioId
            ,TRIM(domcli.ClienteDomicilioDomCalle) AS ClienteDomicilioDomCalle
            ,TRIM(domcli.ClienteDomicilioDomNro) AS ClienteDomicilioDomNro
            ,TRIM(domcli.ClienteDomicilioCodigoPostal) AS  ClienteDomicilioCodigoPostal
            ,domcli.ClienteDomicilioPaisId AS domiciliopais
            ,domcli.ClienteDomicilioProvinciaId
            ,domcli.ClienteDomicilioLocalidadId
            ,domcli.ClienteDomicilioBarrioId
            ,TRIM(domcli.ClienteDomicilioDomLugar) AS ClienteDomicilioDomLugar
            ,TRIM(adm.AdministradorNombre) AS AdministradorNombre
            ,TRIM(adm.AdministradorApellido) AS AdministradorApellido
            ,adm.AdministradorId
        FROM Cliente cli
        LEFT JOIN ClienteFacturacion fac ON fac.ClienteId = cli.ClienteId
            AND fac.ClienteFacturacionDesde <= DATEFROMPARTS(@1,@2, 1)
            AND ISNULL(fac.ClienteFacturacionHasta, '9999-12-31') >= DATEFROMPARTS(@1,@2, 1)
        LEFT JOIN CondicionAnteIVA con ON con.CondicionAnteIVAId = fac.CondicionAnteIVAId
        LEFT JOIN (
            SELECT TOP 1 domcli.ClienteDomicilioId
                ,domcli.ClienteId
                ,domcli.ClienteDomicilioDomCalle
                ,domcli.ClienteDomicilioDomNro
                ,domcli.ClienteDomicilioCodigoPostal
                ,domcli.ClienteDomicilioPaisId
                ,domcli.ClienteDomicilioProvinciaId
                ,domcli.ClienteDomicilioLocalidadId
                ,domcli.ClienteDomicilioBarrioId
                ,domcli.ClienteDomicilioDomLugar
            FROM ClienteDomicilio AS domcli
            WHERE domcli.ClienteId = @0
                AND domcli.ClienteDomicilioActual = 1
            ORDER BY domcli.ClienteDomicilioId DESC
            ) AS domcli ON domcli.ClienteId = cli.ClienteId
        LEFT JOIN (
            SELECT TOP 1 ca.ClienteId
                ,ca.ClienteAdministradorAdministradorId AS AdministradorId
                ,adm.AdministradorNombre
                ,adm.AdministradorApellido
            FROM ClienteAdministrador ca
            JOIN Administrador adm ON adm.AdministradorId = ca.ClienteAdministradorAdministradorId
            WHERE ca.ClienteId = @0
            ORDER BY ca.ClienteAdministradorId DESC
            ) AS adm ON adm.ClienteId = cli.ClienteId
        WHERE cli.ClienteId = @0;`,
            [clienteId,anio,mes])
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
            const ObjCliente =  {...req.body}

            //validaciones
console.log("ObjCliente ", ObjCliente) 
//throw new ClientException(`test`)
            await this.FormValidations(ObjCliente)

            const ClienteFechaAlta = new Date(ObjCliente.ClienteFechaAlta)
            ClienteFechaAlta.setHours(0, 0, 0, 0)

            //update
            let ClienteAdministradorId = null

            if (ObjCliente.AdministradorId != null && ObjCliente.AdministradorId != "")
                {
                    if (ObjCliente.ClienteAdministradorUltNro != null)
                    {
                        ClienteAdministradorId = ObjCliente.ClienteAdministradorUltNro
                        await this.updateAdministradorTable(queryRunner,ClienteId,ObjCliente.ClienteAdministradorUltNro,ObjCliente.AdministradorId)
                    }
                     else
                    {
                         ClienteAdministradorId = 1   
                        await this.insertClienteAdministrador(queryRunner,ClienteId,ClienteAdministradorId,ObjCliente.ClienteFechaAlta,ObjCliente.AdministradorId) 
                    }
                }else if (ObjCliente.ClienteAdministradorUltNro != null){
                        // delete
                      await this.DeleteClienteAdministrador(queryRunner,ObjCliente,ClienteId)
            }

            await this.updateClienteTable(queryRunner,ClienteId,ObjCliente.CLienteNombreFantasia,ObjCliente.ClienteApellidoNombre,ClienteFechaAlta,ClienteAdministradorId)
            await this.updateFacturaTable(queryRunner,ClienteId,ObjCliente.ClienteFacturacionId,ObjCliente.ClienteFacturacionCUIT,ObjCliente.ClienteCondicionAnteIVAId)
            
            await ClientesController.updateClienteDomicilioTable(
                 queryRunner
                ,ClienteId
                ,ObjCliente.ClienteDomicilioId
                ,ObjCliente.ClienteDomicilioDomCalle
                ,ObjCliente.ClienteDomicilioDomNro
                ,ObjCliente.ClienteDomicilioCodigoPostal
                ,ObjCliente.ClienteDomicilioProvinciaId 
                ,ObjCliente.ClienteDomicilioLocalidadId 
                ,ObjCliente.ClienteDomicilioBarrioId
                ,ObjCliente.ClienteDomicilioDomLugar)
               
                    

            const infoCliente = await queryRunner.query(`SELECT ContactoId FROM Contacto WHERE clienteId = @0`,[ClienteId])
            const ContactoIds = infoCliente.map(row => row.ContactoId)
            console.log("ContactoIds",ContactoIds)
            let maxContactoId = ContactoIds.length > 0 ? Math.max(...ContactoIds) : 0
            
            let maxContactoTelefonoId = ObjCliente.ClienteTelefonoUltNro == null ? 1 : ObjCliente.ClienteTelefonoUltNro + 1;
            let maxContactoEmailId = ObjCliente.ClienteEmailUltNro == null ? 1 : ObjCliente.ClienteEmailUltNro + 1;
            
            //ACA SE EVALUA Y SE ELIMINA EL CASO QUE SE BORRE ALGUN REGISTRO DE CLIENTE CONTACTO EXISTENTE
            let numerosQueNoPertenecen = []
            console.log("1", numerosQueNoPertenecen.length)
             numerosQueNoPertenecen = ContactoIds.filter(num => {
                return !ObjCliente.infoClienteContacto.some(obj => obj.ContactoId === num && obj.ContactoId !== 0);
            });

            let newinfoClienteContactoArray = []

            for (const obj of ObjCliente.infoClienteContacto) {

                console.log("obj", obj)

                if(numerosQueNoPertenecen?.length > 0 ) {
                    console.log("no tuvo q pasar", numerosQueNoPertenecen)
                    const exist = numerosQueNoPertenecen.includes(obj.ContactoId)
                    
                    if (exist) {
                    
                        await this.deleteContactoTable(queryRunner,ClienteId, obj.ContactoId)
                        await this.deleteContactoEmailTable(queryRunner,ClienteId,obj.ContactoEmailId,obj.ContactoId)
                        await this.deleteContactoTelefonoTable(queryRunner,ClienteId,obj.ContactoTelefonoId,obj.ContactoId)

                    }
                    

                }else{
                    if (ContactoIds.includes(obj.ContactoId) && obj.ContactoId !== 0) {
                        console.log("paso 1")
                        //update
                          await this.updateContactoTable(queryRunner,ClienteId,obj.ContactoId,obj.nombre,obj.ContactoApellido,obj.area)
      
                          if(obj.ContactoEmailUltNro != null){
      
                              await this.updateContactoEmailTable(queryRunner,ClienteId,obj.ContactoId,obj.ContactoEmailUltNro,obj.correo)
                          }else{

                            maxContactoEmailId += 1

                            await this.insertContactoEmailTable(queryRunner,ClienteId,maxContactoId,maxContactoEmailId,obj.correo)
                            await this.updateContactoUltNro(queryRunner,ClienteId,obj.ContactoId,maxContactoEmailId,null)   
                            
                          }
      
                          if(obj.ContactoTelefonoUltNro != null){
      
                              await this.updateContactoTelefonoTable(queryRunner,ClienteId,obj.ContactoId,obj.ContactoTelefonoUltNro,obj.telefono)
                          
                            }else{

                            maxContactoTelefonoId += 1

                            await this.insertContactoTelefonoTable(queryRunner,ClienteId,maxContactoId,maxContactoTelefonoId,obj.telefono,obj.TipoTelefonoId,
                                obj.ContactoTelefonoCodigoArea)

                            await this.updateContactoUltNro(queryRunner,ClienteId,obj.ContactoId,null,maxContactoTelefonoId)   

                         } 
                         
                      } else {
                        console.log("paso 2")
                         // Insert
                         maxContactoId += 1
                         maxContactoTelefonoId += 1
                         maxContactoEmailId += 1

                         obj.ClienteContactoId = maxContactoId
                         newinfoClienteContactoArray.push(obj)
      
                         await this.insertContactoTable(queryRunner,ClienteId,maxContactoId,obj.nombre,obj.ClienteContactoApellido,obj.area,maxContactoTelefonoId,maxContactoEmailId)
      
                         await this.insertContactoEmailTable(queryRunner,ClienteId,maxContactoId,maxContactoEmailId,obj.correo)
      
                         await this.insertContactoTelefonoTable(queryRunner,ClienteId,maxContactoId,maxContactoTelefonoId,obj.telefono,obj.TipoTelefonoId,
                          obj.ClienteContactoTelefonoCodigoArea)
      
                      }
                }    

            }

            ObjCliente.infoClienteContacto = newinfoClienteContactoArray

            if(ObjCliente.files.length > 1){
             await FileUploadController.handlePDFUpload(ClienteId,'Cliente',ObjCliente.files,usuario,ip ) 
            }

            await queryRunner.commitTransaction()
            return this.jsonRes(ObjCliente, res, 'Modificación  Exitosa');
        }catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    static async updateClienteDomicilioTable(
         queryRunner: any
        ,ClienteId: number
        ,ClienteDomicilioId: number
        ,ClienteDomicilioDomCalle: string
        ,ClienteDomicilioDomNro: string
        ,ClienteDomicilioCodigoPostal: string
        ,ClienteDomicilioProvinciaId: any
        ,ClienteDomicilioLocalidadId: any
        ,ClienteDomicilioBarrioId: any
        ,ClienteDomicilioDomLugar:any){

        await queryRunner.query(`UPDATE ClienteDomicilio
        SET ClienteDomicilioDomCalle = @2,ClienteDomicilioDomNro = @3, ClienteDomicilioCodigoPostal = @4, 
        ClienteDomicilioProvinciaId = @5,ClienteDomicilioLocalidadId = @6,ClienteDomicilioBarrioId = @7,ClienteDomicilioDomLugar=@8
        WHERE ClienteId = @0 AND ClienteDomicilioId = @1`,[
            ClienteId,
            ClienteDomicilioId,
            ClienteDomicilioDomCalle,
            ClienteDomicilioDomNro,
            ClienteDomicilioCodigoPostal,
            ClienteDomicilioProvinciaId,ClienteDomicilioLocalidadId,ClienteDomicilioBarrioId,ClienteDomicilioDomLugar])
     }

    async updateFacturaTable(queryRunner:any,ClienteId:number,ClienteFacturacionId:string,ClienteFacturacionCUIT:string,CondicionAnteIVAId:number){


       await queryRunner.query(`UPDATE ClienteFacturacion
        SET ClienteFacturacionCUIT = @2,CondicionAnteIVAId = @3
        WHERE ClienteId = @0 AND ClienteFacturacionId = @1`,[ClienteId,ClienteFacturacionId,ClienteFacturacionCUIT,CondicionAnteIVAId])
    }
    
    async updateClienteTable(queryRunner:any,ClienteId:number,CLienteNombreFantasia:string,ClienteApellidoNombre:string,ClienteFechaAlta:Date,ClienteAdministradorId:any){

        await queryRunner.query(`UPDATE Cliente
         SET CLienteNombreFantasia = @1, ClienteApellidoNombre = @2, ClienteFechaAlta= @3, ClienteAdministradorUltNro = @4
         WHERE ClienteId = @0`,[ClienteId,CLienteNombreFantasia,ClienteApellidoNombre,ClienteFechaAlta,ClienteAdministradorId])
     }

     async updateAdministradorTable(queryRunner:any,ClienteId:number,ClienteAdministradorId:number,ClienteAdministradorAdministradorId:any){

    
        await queryRunner.query(`
         UPDATE ClienteAdministrador
         SET ClienteAdministradorAdministradorId= @2
         WHERE ClienteId = @0 AND ClienteAdministradorId = @1`,[ClienteId,ClienteAdministradorId,ClienteAdministradorAdministradorId])

    }

    async updateContactoUltNro(queryRunner:any,ClienteId:number,ContactoId:number,ContactoEmailUltNro:any,ContactoTelefonoUltNro:any){

        if(ContactoEmailUltNro == null){
            await queryRunner.query(`
                UPDATE Contacto
                SET ContactoTelefonoUltNro = @2
                WHERE ClienteId = @0 AND ContactoId = @1`,[ClienteId,ContactoId,ContactoTelefonoUltNro])
        }

        if(ContactoTelefonoUltNro == null){
            await queryRunner.query(`
                UPDATE Contacto
                SET ContactoEmailUltNro = @2
                WHERE ClienteId = @0 AND ContactoId = @1`,[ClienteId,ContactoId,ContactoEmailUltNro])
        }

       

     }

     async updateContactoTable(queryRunner:any,ClienteId:number,ContactoId:number,nombre:string,ContactoApellido:string,area:string){

        let ContactoApellidoNombre = 
        (ContactoApellido ? ContactoApellido : '') + 
        (ContactoApellido && nombre ? ',' : '') + 
        (nombre ? nombre : '') || null;


        await queryRunner.query(`
         UPDATE Contacto
         SET ContactoNombre = @2, ContactoApellido = @3, ContactoArea =@4, ContactoApellidoNombre = @5
         WHERE ClienteId = @0 AND ContactoId = @1`,[ClienteId,ContactoId,nombre,ContactoApellido,area,ContactoApellidoNombre])

     }

     async updateContactoEmailTable(queryRunner:any,ClienteId:number,ContactoId:number,ContactoEmailUltNro:number,ContactoEmailEmail:string){

        await queryRunner.query(`
         UPDATE ContactoEmail
         SET ContactoEmailEmail = @2
         WHERE ContactoId=@0 AND ContactoEmailId =@1 `,[ContactoId,ContactoEmailUltNro,ContactoEmailEmail])

     }

     async updateContactoTelefonoTable(queryRunner:any,ClienteId:number,ContactoId:number,ContactoTelefonoUltNro:number,telefono:string){

        await queryRunner.query(`
         UPDATE ContactoTelefono
         SET ContactoTelefonoNro = @2
         WHERE   ContactoId = @0 AND ContactoTelefonoId=@1`,[ContactoId,ContactoTelefonoUltNro,telefono])

     }

     async insertContactoTable(queryRunner:any,ClienteId:number,ContactoId:number,nombre:string,ContactoApellido:string,area:string,maxContactoTelefonoId:number,maxContactoEmailId:number){


        let ContactoApellidoNombre = 
        (ContactoApellido ? ContactoApellido : '') + 
        (ContactoApellido && nombre ? ',' : '') + 
        (nombre ? nombre : '') || null;

        await queryRunner.query(`INSERT INTO Contacto (
            ClienteId,
            ContactoId,
            ContactoApellidoNombre,
            ContactoApellido,
            ContactoNombre,
            ContactoSexo,
            TipoDocumentoId,
            ContactoDocumentoNro,
            ContactoCargo,
            ContactoArea,
            ContactoFechaNacimiento,
            ContactoInactivo,
            ContactoTelefonoUltNro,
            ContactoEmailUltNro )
            
            VALUES (
            @0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13
            )`,[
                ClienteId,
                ContactoId,
                ContactoApellidoNombre,
                nombre,
                ContactoApellido,
                null,
                null,
                null,
                null,
                area,
                null,
                null,
                maxContactoTelefonoId,maxContactoEmailId
                ])

     }

     async insertContactoEmailTable(queryRunner:any,ClienteId:number,ContactoId:number,maxContactoEmailId:number,ContactoEmailEmail:any){

        await queryRunner.query(`INSERT INTO ContactoEmail (
            ContactoId,
            ContactoEmailId,
            ContactoEmailEmail,
            ContactoEmailInactivo
            ) VALUES (
             @0,@1,@2,@3
            )`,[ContactoId,maxContactoEmailId,ContactoEmailEmail,'False'])

     }

     async insertContactoTelefonoTable(queryRunner:any,ClienteId:number,ContactoId:number,maxContactoTelefonoId:number,telefono:string,TipoTelefonoId:number,
        ContactoTelefonoCodigoArea:any){

        await queryRunner.query(`INSERT INTO ContactoTelefono (
            ContactoId,
            ContactoTelefonoId,
            LugarTelefonoId,
            TipoTelefonoId,
            ContactoTelefonoCodigoPais,
            ContactoTelefonoCodigoCelular,
            ContactoTelefonoCodigoArea,
            ContactoTelefonoNro,
            ContactoTelefonoAl,
            ContactoTelefonoInactivo,
            ContactoTelefonoInternoUltNro) VALUES (
            @0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10)
            `,[
               ContactoId,
               maxContactoTelefonoId, 
               null, 
               TipoTelefonoId, 
               null,
               null,
               ContactoTelefonoCodigoArea,
               telefono,
               null,
               null,
               null])

     }

     async deleteCliente(req: Request, res: Response, next: NextFunction) {

        let { id } = req.query
        const ClienteId = Number(id)
        const queryRunner = dataSource.createQueryRunner();

        try {
          await queryRunner.connect();
          await queryRunner.startTransaction();
          
          await this.deleteContactoTable(queryRunner,ClienteId,null)
          await this.deleteContactoEmailTable(queryRunner,ClienteId,null,null)
          await this.deleteContactoTelefonoTable(queryRunner,ClienteId,null,null)
          await this.deleteFileCliente(queryRunner,ClienteId)
    
          await queryRunner.commitTransaction();
    
        } catch (error) {
          this.rollbackTransaction(queryRunner)
          return next(error)
        }
    
      }
    
    async deleteFileCliente(queryRunner:any,ClienteId:number){
        await queryRunner.query("`DELETE FROM lige.dbo.docgeneral WHERE cliente_id = @0 AND doctipo_id = 'CLI' ")
    }


    async deleteContactoTable(queryRunner:any,ClienteId:number,ContactoId:any){

        let deleteCliente = `DELETE FROM Contacto WHERE ClienteId = @0`

        if(ContactoId != null)
            deleteCliente += ` AND ContactoId =@1`

        await queryRunner.query(deleteCliente,[ClienteId,ContactoId])
    } 

    async deleteContactoEmailTable(queryRunner:any,ClienteId:number,ContactoEmailId:any,ContactoId:any){

        let deleteEmail = `DELETE FROM ContactoEmail WHERE ClienteId = @0`

        if(ContactoEmailId != null && ContactoId != null && ContactoId != null)
            deleteEmail += ` AND ContactoEmailId =@1 AND ContactoId = @2 `

        await queryRunner.query(deleteEmail,[ClienteId,ContactoEmailId,ContactoId])
    } 

    async deleteContactoTelefonoTable(queryRunner:any,ClienteId:number,ContactoTelefonoId:any,ContactoId:any){

        let deletTelefono = `DELETE FROM ContactoTelefono WHERE ClienteId = @0`

        if(ContactoTelefonoId != null && ContactoId != null)
            deletTelefono += ` AND ContactoTelefonoId =@1 AND ContactoId = @2`

        await queryRunner.query(deletTelefono,[ClienteId,ContactoTelefonoId, ContactoId])
    } 
    

    async addCliente(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        const ObjCliente = {...req.body};
        console.log(ObjCliente)
        try {

            await queryRunner.startTransaction()

            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)

            //validaciones

            await this.FormValidations(ObjCliente)

            let ClienteDomicilioUltNro = 1
            let ClienteFacturacionId = 1
            let ClienteDomicilioId = 1
            let maxContactoId = 0
            let maxContactoTelefonoId = 0
            let maxContactoEmailId = 0

            const ClienteFechaAlta = new Date(ObjCliente.ClienteFechaAlta)
            ClienteFechaAlta.setHours(0, 0, 0, 0)

            let ClienteAdministradorId = ObjCliente.AdministradorId != null && ObjCliente.AdministradorId != "" ? 1 : null


            await this.insertCliente(queryRunner,ObjCliente.CLienteNombreFantasia,ObjCliente.ClienteApellidoNombre,ClienteFechaAlta,ClienteDomicilioUltNro,ClienteAdministradorId)

            let ClienteSelectId = await queryRunner.query("SELECT MAX(ClienteId) AS MaxClienteId FROM Cliente")
            let ClienteId = ClienteSelectId[0].MaxClienteId

            ObjCliente.id = ClienteId

            await this.insertClienteFacturacion(queryRunner,ClienteId,ClienteFacturacionId,ObjCliente.ClienteFacturacionCUIT,ObjCliente.ClienteCondicionAnteIVAId,ClienteFechaAlta)
            await this.inserClientetDomicilio(queryRunner,ClienteId,ClienteDomicilioId,ObjCliente.ClienteDomicilioDomLugar,ObjCliente.ClienteDomicilioDomCalle,ObjCliente.ClienteDomicilioDomNro,
                ObjCliente.ClienteDomicilioCodigoPostal,ObjCliente.ClienteDomicilioProvinciaId,ObjCliente.ClienteDomicilioLocalidadId,ObjCliente.ClienteDomicilioBarrioId,
            )

            let newinfoClienteContactoArray = []

            for (const obj of ObjCliente.infoClienteContacto) {

                maxContactoId += 1
                maxContactoTelefonoId += 1
                maxContactoEmailId += 1

                obj.ClienteContactoId = maxContactoId

                await this.insertContactoTable(queryRunner,ClienteId,maxContactoId,obj.nombre,obj.ContactoApellido,obj.area,maxContactoTelefonoId,maxContactoEmailId)
                await this.insertContactoEmailTable(queryRunner,ClienteId,maxContactoId,maxContactoEmailId,obj.correo)
                await this.insertContactoTelefonoTable(queryRunner,ClienteId,maxContactoId,maxContactoTelefonoId,obj.telefono,obj.TipoTelefonoId,obj.ContactoTelefonoCodigoArea)
                
                newinfoClienteContactoArray.push(obj)
            }

            ObjCliente.infoClienteContacto = newinfoClienteContactoArray

            if(ClienteAdministradorId != null){
                await this.insertClienteAdministrador(queryRunner,ClienteId,ClienteAdministradorId,ObjCliente.ClienteFechaAlta,ObjCliente.AdministradorId) 
            }

            if(ObjCliente.files.length > 1){
                await FileUploadController.handlePDFUpload(ClienteId,'Cliente',ObjCliente.files,usuario,ip ) 
            }

            await queryRunner.commitTransaction()
            return this.jsonRes(ObjCliente, res, 'Carga  de nuevo registro exitoso');
        }catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }


    async insertCliente(queryRunner:any,CLienteNombreFantasia:any,ClienteApellidoNombre:any,ClienteFechaAlta:any,ClienteDomicilioUltNro:any,ClienteAdministradorUltNro:any){

        await queryRunner.query(`INSERT INTO Cliente (	
        Cliente ConsorcioEs,
        ClienteApellido,
        ClienteNombre,
        ClienteDenominacion,
        ClienteNombreFantasia,
        ClienteApellidoNombre,
        ClienteSexo,
        ClienteFechaAlta,
        ClienteInactivo,
        ClienteContactoUltNro,
        ClienteTelefonoUltNro,
        ClienteEmailUltNro,
        ClientePaginaWebUltNro,
        ClienteCoordinadorCuentaUltNro,
        ClienteCobradorUltNro,
        ClienteFacturaUltNro,
        ClienteContratoUltNro,
        ClienteDomicilioUltNro,
        ClientePresupuestoUltNro,
        ClienteRubroUltNro,
        ClienteElementoDependienteUltNro,
        ClienteFacturacionUltNro,
        ClienteAdministradorUltNro,
        ClientePropio,
        ClienteSucursalId,
        ClienteImagenId) VALUES (
        @0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13,@14,@15,@16,@17,@18,@19,@20,@21,@22,@23,@24,@25
        )`,[
         null,
         null,
         null,
         ClienteApellidoNombre,
         CLienteNombreFantasia,
         ClienteApellidoNombre,
         null,
         ClienteFechaAlta,
         null,
         null,
         null,
         null,
         null,
         null,
         null,
         null,
         null,
         ClienteDomicilioUltNro,
         null,
         null,
         null,
         null,
         ClienteAdministradorUltNro,
         null,
         null,
         null
        ])
    }

    async insertClienteFacturacion(queryRunner:any,ClienteId:any,ClienteFacturacionId:any,CondicionAnteIVAId:any,ClienteFacturacionCUIT:any,ClienteFechaAlta:Date){

      await queryRunner.query(`INSERT INTO ClienteFacturacion (
        ClienteId,
        ClienteFacturacionId,
        ClienteFacturacionCUIT,
        CondicionAnteIVAId,
        ClienteFacturacionTipoFactura,
        ClienteFacturacionTipoFacturacion,
        ClienteFacturacionDesde,
        ClienteFacturacionHasta) VALUES (
        @0,@1,@2,@3,@4,@5,@6,@7)`,[ClienteId,ClienteFacturacionId,CondicionAnteIVAId,ClienteFacturacionCUIT,null,null,ClienteFechaAlta,null] )
    }

    async inserClientetDomicilio(queryRunner:any,ClienteId:any,ClienteDomicilioId:any,ClienteDomicilioDomLugar:any,ClienteDomicilioDomCalle:any,
        ClienteDomicilioDomNro:any,ClienteDomicilioCodigoPostal:any,ClienteDomicilioProvinciaId:any,ClienteDomicilioLocalidadId:any,ClienteDomicilioBarrioId:any,
){

        await queryRunner.query(`INSERT INTO ClienteDomicilio (
            ClienteId,
            ClienteDomicilioId,
            ClienteDomicilioDomLugar,
            ClienteDomicilioRutaTipoRuta,
            ClienteDomicilioRutaCatalogacion,
            ClienteDomicilioRutaKm,
            ClienteDomicilioDomCalle,
            ClienteDomicilioDomNro,
            ClienteDomicilioDomPiso,
            ClienteDomicilioDomDpto,
            ClienteDomicilioEntreRutaTipoRuta,
            ClienteDomicilioEntreRutaCatalogacion,
            ClienteDomicilioYRutaTipoRuta,
            ClienteDomicilioYRutaCatalogacion,
            ClienteDomicilioEntreEsquina,
            ClienteDomicilioEntreEsquinaY,
            ClienteDomicilioDomBloque,
            ClienteDomicilioDomEdificio,
            ClienteDomicilioDomCuerpo,
            ClienteDomicilioCodigoPostal,
            ClienteDomicilioPaisId,
            ClienteDomicilioProvinciaId,
            ClienteDomicilioLocalidadId,
            ClienteDomicilioBarrioId,
            ClienteDomicilioActual,
            ClienteDomicilioComercial,
            ClienteDomicilioOperativo) VALUES ( @0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13,@14,@15,@16,@17,@18,@19,@20,@21,@22,@23,@24,@25,@26
            )`,[ClienteId,
                ClienteDomicilioId,
                ClienteDomicilioDomLugar,
                null,
                null,
                null,
                ClienteDomicilioDomCalle,
                ClienteDomicilioDomNro,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                ClienteDomicilioCodigoPostal,
                1,
                ClienteDomicilioProvinciaId,
                ClienteDomicilioLocalidadId,
                ClienteDomicilioBarrioId,
                1,
                1,
                1

            ])
          }


          async insertClienteAdministrador(queryRunner:any,ClienteId:number,ClienteAdministradorId:number,ClienteFechaAlta:Date,ClienteAdministradorAdministradorId:number){

            await queryRunner.query(` INSERT INTO ClienteAdministrador (
                ClienteId,
                ClienteAdministradorId,
                ClienteAdministradorDesde,
                ClienteAdministradorHasta,
                ClienteAdministradorAdministradorId
                ) VALUES ( @0,@1,@2,@3,@4
                )`,[ClienteId,ClienteAdministradorId,ClienteFechaAlta,null,ClienteAdministradorAdministradorId])
    
    
        }

        async DeleteClienteAdministrador(queryRunner:any,ObjCliente:any,ClienteId:number){
       
 
            await queryRunner.query(` DELETE FROM ClienteAdministrador 
                WHERE ClienteId=@0 AND ClienteAdministradorId=@1 `,[ClienteId,ObjCliente.ClienteAdministradorUltNro])
    
       }
    
        async insertAdministrador(queryRunner:any,  AdministradorApellido:any,
            AdministradorNombre:any, AdministradorDenominacion:any,
            AdministradorNombreFantasia:any,){
    
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
                )`,[AdministradorApellido,AdministradorNombre,AdministradorDenominacion,
                    AdministradorNombreFantasia,AdministradorApellidoNombre,null,null,null,null,null,null,null,null,null,null])
    
        }

        async FormValidations(form:any){
    
    
            if(!form.ClienteFacturacionCUIT) {
               throw new ClientException(`El campo CUIT NO pueden estar vacio.`)
            }
    
            if(!form.ClienteFechaAlta) {
               throw new ClientException(`El campo Fecha Inicial NO pueden estar vacio.`)
            }
    
            if(!form.CLienteNombreFantasia) {
                throw new ClientException(`El campo  Nombre Fantasía NO pueden estar vacio.`)
            }
    
            if(!form.ClienteCondicionAnteIVAId) {
               throw new ClientException(`El campo Condición Ante IVA NO pueden estar vacio.`)
            }
    
            if(!form.ClienteApellidoNombre) {
               throw new ClientException(`El campo Razón Social NO pueden estar vacio.`)
            }
    
            //Domicilio
    
            if(!form.ClienteDomicilioDomCalle) {
                throw new ClientException(`El campo Dirección Calle NO pueden estar vacio.`)
             }
     
             if(!form.ClienteDomicilioDomNro) {
                throw new ClientException(`El campo Nro NO pueden estar vacio.`)
             }
     
             if(!form.ClienteDomicilioCodigoPostal) {
                 throw new ClientException(`El campo Cod Postal NO pueden estar vacio.`)
             }
     
             if(!form.ClienteDomicilioProvinciaId) {
                throw new ClientException(`El campo Provincia Ante IVA NO pueden estar vacio.`)
             }

             if(!form.ClienteDomicilioLocalidadId) {
                throw new ClientException(`El campo Localidad NO pueden estar vacio.`)
             }
     
            //  if(!form.ClienteDomicilioBarrioId) {
            //     throw new ClientException(`El campo Barrio NO pueden estar vacio.`)
            //  }
    
             
    
            // CLIENTE CONTACTO
    
             for(const obj of form.infoClienteContacto){
    
                if(!obj.nombre) {
                    throw new ClientException(`El campo Nombre en cliente contacto NO pueden estar vacio.`)
                 }
    
                 if(!obj.ContactoApellido) {
                    throw new ClientException(`El campo Apellido en cliente contacto NO pueden estar vacio.`)
                 }
    
                if(!obj.TipoTelefonoId) {
                    throw new ClientException(`El campo Tipo Telefono NO pueden estar vacio.`)
                }
    
             }
    
            
    
        }     

}
