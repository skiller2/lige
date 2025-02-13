import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { QueryResult } from "typeorm";
import { FileUploadController } from "../controller/file-upload.controller"
import { info } from "pdfjs-dist/types/src/shared/util";
import { existsSync } from "fs";
import { QueryRunner } from "typeorm";
import { fileURLToPath } from 'url';
import { Utils } from "../liquidaciones/liquidaciones.utils";
import { MultiFormatReader, BarcodeFormat, RGBLuminanceSource, BinaryBitmap, HybridBinarizer, NotFoundException, DecodeHintType, Binarizer, QRCodeReader } from '@zxing/library';
import path from "path";
import qrCode from 'qrcode-reader';
import fs from "fs";
import { Jimp } from "jimp"



export class AccesoBotController extends BaseController {

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
            name: " fecha de modificación",
            type: "date",
            id: "aud_fecha_mod",
            field: "aud_fecha_mod",
            fieldName: "aud_fecha_mod",
            searchComponent: "inpurForPersonalSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Nombre",
            type: "string",
            id: "Nombre",
            field: "Nombre",
            fieldName: "per.PersonalApellidoNombre",
            searchComponent: "inpurForPersonalSearch",
            searchType: "string",
            searchHidden: false
        },
        {
            name: "CUIT",
            type: "number",
            id: "PersonalCUITCUILCUIT",
            field: "PersonalCUITCUILCUIT",
            fieldName: "cuit.PersonalCUITCUILCUIT",
            sortable: true,
            hidden: false,
            searchHidden: false
        },

        {
            name: "DNI",
            type: "number",
            id: "PersonalDocumentoNro",
            field: "PersonalDocumentoNro",
            fieldName: "doc.PersonalDocumentoNro",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Número de teléfono",
            type: "number",
            id: "telefono",
            field: "telefono",
            fieldName: "reg.telefono",
            sortable: true,
            hidden: false,
            searchHidden: false
        }

    ];

    async getGridCols(req, res) {
        this.jsonRes(this.listaColumnas, res);
    }


    async list(req: any, res: Response, next: NextFunction) {

        const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()

        try {

            const regtelefonopersonal = await queryRunner.query(
                `SELECT
                reg.personal_id AS id,
                per.PersonalApellidoNombre AS Nombre, 
                cuit.PersonalCUITCUILCUIT,
                doc.PersonalDocumentoNro,
                reg.telefono,
                aud_fecha_mod
                FROM lige.dbo.regtelefonopersonal AS reg
                JOIN personal AS per ON per.PersonalId = reg.personal_id

                JOIN PersonalDocumento AS doc ON doc.PersonalId = reg.personal_id
                AND doc.PersonalDocumentoId = ( SELECT MAX(docmax.PersonalDocumentoId) FROM PersonalDocumento docmax WHERE docmax.PersonalId = per.PersonalId) 

                LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId 
                AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)       

                WHERE 
                    ${filterSql}
            ${orderBy}`, [fechaActual])

            this.jsonRes(
                {
                    total: regtelefonopersonal.length,
                    list: regtelefonopersonal,
                },
                res
            );

        } catch (error) {
            return next(error)
        }

    }

    async getAccess(req: Request, res: Response, next: NextFunction) {
        const PersonalId = Number(req.params.PersonalId)
        const queryRunner = dataSource.createQueryRunner();

        try {

            let result = await this.getAccessQuery(queryRunner, PersonalId)
            this.jsonRes(result[0], res);

        } catch (error) {
            return next(error)
        }
    }


    async getAccessQuery(queryRunner: QueryRunner, PersonalId: any) {
        let selectquery = `SELECT
                reg.personal_id AS PersonalId,
                doc.PersonalDocumentoNro,
                reg.telefono,
                codigo
                FROM lige.dbo.regtelefonopersonal AS reg
                JOIN personal AS per ON per.PersonalId = reg.personal_id

                JOIN PersonalDocumento AS doc ON doc.PersonalId = reg.personal_id
                AND doc.PersonalDocumentoId = ( SELECT MAX(docmax.PersonalDocumentoId) FROM PersonalDocumento docmax WHERE docmax.PersonalId = per.PersonalId)
                    
            WHERE reg.personal_id = @0 `

        const result = await queryRunner.query(selectquery, [PersonalId])
        return result
    }


    async deleteAccess(req: Request, res: Response, next: NextFunction) {

        const PersonalId = Number(req.params.PersonalId)
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            await queryRunner.query(`DELETE FROM lige.dbo.regtelefonopersonal WHERE personal_id = @0`, [PersonalId])

            this.jsonRes({ list: [] }, res, `Acceso borrado con exito`);

            await queryRunner.commitTransaction();

        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }

    }

    async getAccessDni(req: Request, res: Response, next: NextFunction) {
        const PersonalId = Number(req.params.PersonalId)
        const queryRunner = dataSource.createQueryRunner();

        try {
            let result
            let resultgetAccessQuery = await this.getAccessQuery(queryRunner, PersonalId)

            if (!resultgetAccessQuery || resultgetAccessQuery.length === 0) {
                result = await this.getAccessDniQuery(queryRunner, PersonalId)
                result[0].isNew = false
            } else {
                result = resultgetAccessQuery
                result[0].isNew = true
            }

            //let resultgetAccessDniQuery = await this.getAccessDniQuery(queryRunner, PersonalId)
            this.jsonRes(result[0], res);
        } catch (error) {
            return next(error)
        }
    }

    async getAccessDniQuery(queryRunner: QueryRunner, PersonalId: any) {
        let selectquery = `SELECT docmax.PersonalDocumentoNro,tel.PersonalTelefonoNro
        FROM PersonalDocumento docmax
        INNER JOIN PersonalTelefono tel ON docmax.PersonalId = tel.PersonalId
        WHERE docmax.PersonalId = @0
        AND docmax.TipoDocumentoId = 1
        AND tel.PersonalTelefonoId = (
            SELECT MAX(PersonalTelefonoId)
            FROM PersonalTelefono
            WHERE PersonalId = docmax.PersonalId
    );`
        const result = await queryRunner.query(selectquery, [PersonalId])
        return result
    }


    async updateAcess(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();

        try {
            await queryRunner.startTransaction()
            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)

            const fecha = new Date()

            let {
                PersonalId,
                PersonalDocumentoNro,
                telefono,
                codigo,
                nuevoCodigo,
                files

            } = req.body

            let numeroAleatorio
            let newArray = { ...req.body }

            //throw new ClientException(`test.`)

            //validaciones
            await this.FormValidations(req.body)

            if (nuevoCodigo) {
                numeroAleatorio = await this.generarNumeroAleatorio()
                newArray.codigo = numeroAleatorio.toString()
            }

            await this.AccesoBotEditQuery(queryRunner, telefono, newArray.codigo, PersonalId, PersonalDocumentoNro, usuario, ip, fecha)

            if (files?.length > 0) {

                //await this.QrValidate(files)
                await this.DocumentoImagenDocumento(queryRunner, files, newArray.PersonalId)


            }

            await queryRunner.commitTransaction()

            return this.jsonRes(newArray, res, 'Modificación  Exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async addAccess(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();

        try {
            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)

            const fecha = new Date()
            //throw new ClientException(`test.`)
            await queryRunner.startTransaction()

            let { files } = req.body

            let numeroAleatorio
            let newArray = { ...req.body }

            //validaciones
            await this.FormValidations(req.body)


            if (!req.body.nuevoCodigo) {
                throw new ClientException(`Debe Marcar la opcion de generar un nuevo codigo.`)
            }

            numeroAleatorio = await this.generarNumeroAleatorio()
            newArray.codigo = numeroAleatorio

            if (files?.length > 0)
                await this.DocumentoImagenDocumento(queryRunner, files, newArray.PersonalId)

            await this.AccesoBotNewQuery(queryRunner, newArray.PersonalId, newArray.telefono, newArray.codigo, usuario, ip, fecha)

            await queryRunner.commitTransaction()
            return this.jsonRes(newArray, res, 'Carga de registro Exitosa')
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async validateCuit(req: any, res: Response, next: NextFunction) {

        const cuit = Number(req.params.cuit)
        const queryRunner = dataSource.createQueryRunner()
        let existCuit

        try {

            const result = await queryRunner.query(`SELECT * FROM PersonalCUITCUIL WHERE PersonalCUITCUILCUIT = @0`, [cuit])
            if(result?.length < 1)
                throw new ClientException(`El CUIT seleccionado no se encuentra registrado`)

            this.jsonRes(existCuit, res)

        } catch (error) {
            return next(error)
        }
    }

    async validateRecibo(req: any, res: Response, next: NextFunction) {

        const recibo = Number(req.params.recibo)
        const cuit = Number(req.params.cuit)
        const usuario = res.locals.userName
        const ip = this.getRemoteAddress(req)
        const queryRunner = dataSource.createQueryRunner();
console.log('validateRecibo', cuit, recibo)
        try {

            let personaIdQuery = await queryRunner.query(`SELECT PersonalId FROM PersonalCUITCUIL WHERE PersonalCUITCUILCUIT = @0`, [cuit])
            const personalId = personaIdQuery[0].PersonalId


            const result = await queryRunner.query(`SELECT TOP 2 rec.idrecibo FROM lige.dbo.docgeneral rec
                WHERE rec.persona_id = @0 AND rec.doctipo_id='REC'
                ORDER BY rec.fecha DESC
            `, [personalId])
            if(result.length < 1)
                throw new ClientException(`El número de recibo es incorrecto para el CUIT ${cuit} `)

            if(result[0].idrecibo != recibo && result[1].idrecibo != recibo)
                throw new ClientException(`El número de recibo es incorrecto para el CUIT ${cuit} `)

            this.jsonRes("OK", res)
        } catch (error) {
            return next(error)
        }
    }

    async validateCbu(req: any, res: Response, next: NextFunction) {

        const cbu = String(req.params.cbu).trim()
        const cuit = String(req.params.cuit).trim()
        const encTelNro = req.params.encTelNro

        const usuario = res.locals.userName
        const ip = this.getRemoteAddress(req)
        const fecha = new Date()
        let newValue
        const queryRunner = dataSource.createQueryRunner()

        try {
            console.log('validateCbu', cuit, cbu)

            if (cbu.length != 6)
                throw new ClientException(`Debe ingresar los últimos 6 digitos CBU para el CUIT ${cuit}`);

            let personaIdQuery = await queryRunner.query(`SELECT PersonalId FROM PersonalCUITCUIL WHERE PersonalCUITCUILCUIT = @0`, [cuit])
            const personalId = personaIdQuery[0].PersonalId

            const result = await queryRunner.query(`SELECT cue.PersonalId, ban.BancoDescripcion, cue.PersonalBancoCBU, cue.PersonalBancoDesde, cue.PersonalBancoHasta 
                FROM PersonalBanco cue 
                JOIN Banco ban ON ban.BancoId = cue.PersonalBancoBancoId 
                WHERE cue.PersonalId = @0 
                AND cue.PersonalBancoDesde <= @1 AND  @1 <= ISNUlL(cue.PersonalBancoHasta,'9999-12-31' )
                ORDER BY cue.PersonalBancoHasta DESC;
            `, [personalId,fecha])
                
                   
                
            if (result.length == 0 || result[0].PersonalBancoCBU.slice(-6) != cbu)
                throw new ClientException(`El número proporcionado es incorrecto para el CUIT ${cuit}`);


            let base_url = process.env.URL_MESS_API || "http://localhost:3010"
            let url = `${base_url}/api/personal/ident?cuit=${cuit}&encTelNro=${encTelNro}`;



            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json', 
                };

            const response = await fetch(url, { method: 'GET', headers: headers })

            const responsejson: any = await response.json()
            if (response.status == 200) {
                newValue = responsejson?.data.codigo
            } else {
                throw new ClientException(responsejson?.msg)
            }

            this.jsonRes(newValue, res);
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }
    }

    async DocumentoImagenDocumento(queryRunner: any, files: any, PersonalId: any) {

        // 12 es frente
        // 13 es dorso

        for (const file of files) {

            try {

                const path = `${process.env.PATH_DOCUMENTS}/temp/${file.filename}`
                let existfile = await fs.existsSync(path)

                if (existfile) {
                    // determinar cuando valida el dni q el archivo validado es el frente para su correspondiente guardado
                    let isFrente = file.esFrenteODorso === 12 ? file.esFrenteODorso : 13

                    //let exisfile
                    let typefile = file.originalname.split(".")[1]


                    const DocumentoImagen = await queryRunner.query(`SELECT IDENT_CURRENT('DocumentoImagenDocumento')`)
                    let DocumentoImagenId = DocumentoImagen[0][''] + 1

                    let nameFile = isFrente === 12 ? `${PersonalId}-${DocumentoImagenId}-DOCUMENFREN.${typefile}` : `${PersonalId}-${DocumentoImagenId}-DOCUMENDOR.${typefile}`

                    await queryRunner.query(`INSERT INTO DocumentoImagenDocumento (
                        PersonalId,
                        DocumentoImagenDocumentoBlobTipoArchivo,
                        DocumentoImagenDocumentoBlobNombreArchivo,
                        DocumentoImagenParametroId,
                        DocumentoImagenParametroDirectorioId ) 
                    VALUES ( @0,@1,@2,@3,@4)`, [PersonalId, typefile, nameFile, isFrente, 1])


                    await FileUploadController.moveFile(file.filename, `${process.env.PATH_DNI}/${nameFile}`, process.env.PATH_DNI);
                }

            } catch (error) {
            }
        }

    }


    async AccesoBotNewQuery(queryRunner: any, PersonalId: any, telefono: any, codigo: any, usuario: any, ip: any, fecha: any) {

        await queryRunner.query(`INSERT INTO lige.dbo.regtelefonopersonal 
            (
            	personal_id,
                telefono,
                aud_usuario_ins,
                aud_ip_ins,
                aud_fecha_ins,
                aud_usuario_mod,
                aud_ip_mod,
                aud_fecha_mod,
                codigo,
                des_doc_ident 
            ) 
            VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9)`, [PersonalId, telefono, usuario, ip, fecha, usuario, ip, fecha, codigo, null])


    }

    async AccesoBotEditQuery(queryRunner: any, telefono: any, codigo: any, PersonalId: any, PersonalDocumentoNro: any, usuario: any, ip: any, fecha: any) {

        await queryRunner.query(`UPDATE lige.dbo.regtelefonopersonal
            SET telefono=@0,codigo = @1, aud_usuario_mod = @3, aud_ip_mod = @4 ,aud_fecha_mod = @5
            WHERE Personal_id = @2`, [telefono, codigo, PersonalId, usuario, ip, fecha])


    }

    async generarNumeroAleatorio() {
        return Math.floor(100000 + Math.random() * 900000);
    }



    async FormValidations(form: any) {


        if (!form.PersonalDocumentoNro) {
            throw new ClientException(`No posee DNI.`)
        }

        if (!form.PersonalId) {
            throw new ClientException(`Debe completar el campo Persona.`)
        }

        if (!form.telefono || !/^(549)\d+$/.test(form.telefono)) {
            throw new ClientException(`Debe completar el campo telefono con un número válido que comience con "549".`);
        }

        if (form.files?.length == 1 || form.files?.length > 2) {
            throw new ClientException(`Debe cargar dos imagenes DNI frente y DNI Dorso".`);
        }


    }


    async QrValidate(files: any) {

        const results = [];

        for (const file of files) {

            const fullPath = path.join(file.destination, file.filename);
            const normalizedPath = fullPath.replace(/\\/g, '/');

            try {

                const readQRCode = async (fileName) => {
                    const filePath = normalizedPath
                    console.log("filePath ", filePath)
                    try {
                        if (fs.existsSync(filePath)) {
                            const img = await Jimp.read(fs.readFileSync(filePath));
                            const qr = new qrCode();
                            const value = await new Promise((resolve, reject) => {
                                qr.callback = (err, v) => err != null ? reject(err) : resolve(v);
                                qr.decode(img.bitmap);
                            });
                            return value;
                        }
                    } catch (error) {
                        return error.message
                    }
                }

                readQRCode(normalizedPath).then(console.log).catch(console.log)
            } catch (error) {
                if (error instanceof NotFoundException) {
                    console.error(`No se encontró un código QR en la imagen ${file.filename}.`);
                    results.push({ error: "No se encontró un código QR en la imagen." });
                } else {
                    console.error(`Error en la imagen ${file.filename}:`, error.message);
                    results.push({ error: error.message });
                }
            }
        }

        return results;

    }

    async ValidateImgCode(files: any) {

        const results = [];

        for (const file of files) {

            const fullPath = path.join(file.destination, file.filename);
            const normalizedPath = fullPath.replace(/\\/g, '/');


            const resBuffer = Buffer.from(fs.readFileSync(normalizedPath));

            const hints = new Map();
            const formats = [BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX/*, ...*/];

            hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

            const reader = new MultiFormatReader();

            const luminanceSource = new RGBLuminanceSource(new Uint8ClampedArray(resBuffer.buffer), 400, 500);
            const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));


            reader.decode(binaryBitmap, hints);

        }

        return results;

    }

    async downloadImagenDNI(path: any, res: Response, next: NextFunction) {

        const pathArchivos = (process.env.PATH_DOCUMENTS) ? process.env.PATH_DOCUMENTS : '.'
        try {

            const downloadPath = `${pathArchivos}/temp/${path}`;

            if (existsSync(downloadPath))
                res.download(downloadPath, path, (msg) => { });


        } catch (error) {
            return next(error)
        }
    }

    async getByDownloadFileDni(req: any, res: Response, next: NextFunction) {

        const PersonalId = Number(req.body.PersonalId);
        const DocumentoImagenParametroId = String(req.body.id);

        const queryRunner = dataSource.createQueryRunner();
        const pathArchivos = (process.env.PATH_DNI) ? process.env.PATH_DNI : '.'
        try {

            let ds = await queryRunner
                .query(`SELECT DocumentoImagenDocumentoBlobNombreArchivo, DocumentoImagenParametroId
                FROM DocumentoImagenDocumento
                WHERE PersonalId = @0 
                AND DocumentoImagenParametroId = @1
                AND DocumentoImagenDocumentoId = (
                    SELECT MAX(DocumentoImagenDocumentoId)
                    FROM DocumentoImagenDocumento
                    WHERE PersonalId = @0 AND DocumentoImagenParametroId = @1
                ); `,
                    [PersonalId, DocumentoImagenParametroId]
                )

            const downloadPath = `${pathArchivos}/${ds[0]?.DocumentoImagenDocumentoBlobNombreArchivo}`

            if (existsSync(downloadPath))
                res.download(downloadPath, ds[0].DocumentoImagenDocumentoBlobNombreArchivo)
            else
                res.status(204).send()

        } catch (error) {
            return next(error)
        }
    }

    static getBotStatus(anio: number, mes: number, queryRunner: QueryRunner, personalIdList: number[]) {
        return queryRunner
        .query(`SELECT per.PersonalId, tel.personal_id, tel.codigo, IIF(tel.personal_id IS NOT NULL AND tel.codigo IS NuLL,'OK','Registro pendiente') AS registro, 
            dl.fecha_descarga, doc.doc_id, pr.anio, pr.mes, IIF(doc.doc_id IS NOT NULL,CONCAT('Recibo visto ',pr.mes,'/',pr.anio),CONCAT('Recibo ',pr.mes,'/',pr.anio,' pendiente')) AS descarga
            FROM lige.dbo.Personal per 
            LEFT JOIN lige.dbo.regtelefonopersonal tel ON tel.personal_id = per.PersonalId
            LEFT JOIN lige.dbo.liqmaperiodo pr ON pr.anio = @1 AND pr.mes = @2
            LEFT JOIN lige.dbo.doc_descaga_log dl ON dl.telefono = tel.telefono
            LEFT JOIN lige.dbo.docgeneral doc ON doc.doc_id= dl.doc_id AND doc.persona_id = per.PersonalId AND doc.doctipo_id = 'REC' AND doc.periodo = pr.periodo_id
            WHERE 
            per.PersonalId IN (${personalIdList.join(',')})`, [,anio, mes]) 
        
}
  
}
