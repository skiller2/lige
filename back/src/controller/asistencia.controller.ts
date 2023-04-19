import { Response } from "express";
import { BaseController } from "./baseController";
import { dataSource } from "../data-source";


export class AsistenciaController extends BaseController {


    async getCategoria(
        req: any,
        res: Response
    ) {
        try {
            const result = await dataSource.query(
                `SELECT val.ValorLiquidacionSucursalId, tip.TipoAsociadoDescripcion, tip.TipoAsociadoId, cat.CategoriaPersonalId, cat.CategoriaPersonalDescripcion, val.ValorLiquidacionHoraNormal
                FROM CategoriaPersonal cat
                JOIN TipoAsociado tip ON tip.TipoAsociadoId = cat.TipoAsociadoId
                JOIN ValorLiquidacion val ON val.ValorLiquidacionTipoAsociadoId = tip.TipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId=cat.CategoriaPersonalId
                WHERE GETDATE() BETWEEN val.ValorLiquidacionDesde AND COALESCE(val.ValorLiquidacionHasta, '9999-12-31')
                `
            )
            this.jsonRes(result, res)
        }
        catch (err) {
            this.errRes(err, res, "Error accediendo a la base de datos", 409)
        }
    }
    async setExcepcion(
        req: any,
        res: Response
    ) {
        const queryRunner = dataSource.createQueryRunner()

        try {
            let { SucursalId, anio, mes, ObjetivoId, PersonaId, metodologia, Equivalencia, SumaFija, AdicionalHora, Horas } = req.body;
            const fechaDesde = new Date(anio, mes-1, 1)
            let fechaHasta = new Date(anio, mes , 1)
            fechaHasta.setDate(fechaHasta.getDate() - 1)

            if (!Equivalencia) {
                Equivalencia = {
                    TipoAsociadoId: 'NULL',
                    CategoriaPersonalId: 'NULL'
                }
            }

            if (SumaFija ==undefined)
                SumaFija = null
                    
            if (AdicionalHora ==undefined)
                AdicionalHora = null
            if (Horas==undefined)
                Horas = null

            switch (metodologia) {
                case "E":
                    if (!Equivalencia.TipoAsociadoId) {
                        this.errRes(1, res, "Debe seleccionar una categoria", 409)
                        return
                    }
                    break;
                case "S":
                    if (!SumaFija) {
                        this.errRes(1, res, "Debe ingresar una monto", 409)
                        return
                    }

                    break;
                case "H":
                    if (!Horas) {
                        this.errRes(1, res, "Debe ingresar horas adicionales", 409)
                        return
                    }

                    break;
                case "A":
                    if (!AdicionalHora) {
                        this.errRes(1, res, "Debe ingresar una monto adicional por hora", 409)
                        return
                    }

                    break;

                default:
                    this.errRes(1, res, "Debe seleccionar metodología", 409)
                    return

                    break;
            }

            let result = await dataSource.query(
                `SELECT percat.PersonalCategoriaTipoAsociadoId,percat.PersonalCategoriaCategoriaPersonalId, cat.CategoriaPersonalDescripcion, percat.PersonalCategoriaDesde, percat.PersonalCategoriaHasta
                FROM Personal per
                JOIN PersonalCategoria percat ON percat.PersonalCategoriaPersonalId = per.PersonalId
                JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = percat.PersonalCategoriaTipoAsociadoId AND  cat.CategoriaPersonalId = percat.PersonalCategoriaCategoriaPersonalId
                WHERE per.PersonalId = @0 AND percat.PersonalCategoriaDesde <= @1 AND (percat.PersonalCategoriaHasta >= @1 OR percat.PersonalCategoriaHasta IS NULL)
                `, [PersonaId, fechaDesde]
            )

            let row: any
            if (row = result[0]) {
                if (metodologia == "E") {
                    if (Equivalencia.CategoriaPersonalId == row['PersonalCategoriaCategoriaPersonalId'] &&
                        Equivalencia.TipoAsociadoId == row['PersonalCategoriaTipoAsociadoId']) {
                        this.errRes(1, res, "Categoría de equivalencia, debe ser distinta a la vigente de la persona", 409)
                        return
                    }
                }
            }

            await queryRunner.connect()
            await queryRunner.startTransaction()
            //Traigo el Art14 para analizarlo            
            result = await queryRunner.query(
                `SELECT art.PersonalArt14Id, art.Personalid, art.PersonalArt14ObjetivoId, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, 
                art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde, art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta,
                1
                
                FROM PersonalArt14 art
                WHERE art.Personalid = @0 AND art.PersonalArt14ObjetivoId=@1 AND art.PersonalArt14FormaArt14 = @2
                AND art.PersonalArt14AutorizadoDesde <= @3 AND (art.PersonalArt14AutorizadoHasta >= @3 OR art.PersonalArt14AutorizadoHasta is null)`,
                [PersonaId, ObjetivoId, metodologia, fechaDesde]
            )
            result.forEach(row => {
                let hasta: Date = new Date(fechaDesde)
                hasta.setDate(fechaDesde.getDate() - 1)

                console.log('seteo la fechaart.PersonalArt14AutorizadoHasta', hasta, row)

                queryRunner.query(
                    `UPDATE PersonalArt14 SET PersonalArt14AutorizadoHasta=@2
                    WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
                    [row['PersonalArt14Id'],PersonaId, hasta]
                )
            })

            result = await dataSource.query(
                `SELECT art.PersonalArt14Id, art.Personalid, art.PersonalArt14ObjetivoId, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, 
                art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde, art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta,
                1
                
                FROM PersonalArt14 art
                WHERE art.Personalid = @0 AND art.PersonalArt14ObjetivoId=@1 AND art.PersonalArt14FormaArt14 = @2
                AND art.PersonalArt14Desde <= @3 AND (art.PersonalArt14Hasta >= @3 OR art.PersonalArt14Hasta is null)`,
                [PersonaId, ObjetivoId, metodologia, fechaDesde]
            )
            result.forEach(row => {
                console.log('borro el registro', row)

                queryRunner.query(
                    `DELETE FROM PersonalArt14 
                    WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
                    [row['PersonalArt14Id'],PersonaId]
                )

            })

            result = await queryRunner.query(
                `SELECT per.Personalid, per.PersonalArt14UltNro
                FROM Personal per WHERE per.Personalid = @0   
            `, [PersonaId])

            let PersonalArt14UltNro: number = 0
            if (row = result[0]) {
                if (row['PersonalArt14UltNro'] > 0)
                    PersonalArt14UltNro = row['PersonalArt14UltNro']
            }
            PersonalArt14UltNro++

            result = await queryRunner.query(
                `INSERT INTO PersonalArt14(PersonalArt14Id, PersonalArt14FormaArt14, PersonalArt14SumaFija, PersonalArt14AdicionalHora, PersonalArt14Horas, PersonalArt14Porcentaje, PersonalArt14Desde, 
                    PersonalArt14Hasta, PersonalArt14Autorizado, PersonalArt14AutorizadoDesde, PersonalArt14AutorizadoHasta, PersonalArt14Anulacion, PersonalArt14Puesto, PersonalArt14Dia, PersonalArt14Tiempo, PersonalId, 
                    PersonalArt14TipoAsociadoId, PersonalArt14CategoriaId, PersonalArt14ConceptoId, PersonalArt14ObjetivoId, PersonalArt14QuienAutorizoId, PersonalArt14UsuarioId) 
                    VALUES(@0, @1, 
                    @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17, @18, @19, @20, @21)
                `, [PersonalArt14UltNro, metodologia, SumaFija, AdicionalHora, Horas, null, fechaDesde,
                null, 'N', null, null, null, null, null, null, PersonaId,
                Equivalencia.TipoAsociadoId, Equivalencia.CategoriaPersonalId, null, ObjetivoId, null, null])




            result = await queryRunner.query(
                `UPDATE Personal SET PersonalArt14UltNro=@1  WHERE PersonalId = @0
                `, [PersonaId, PersonalArt14UltNro])


            await queryRunner.rollbackTransaction()

            this.jsonRes([], res)
        }
        catch (err) {
            await queryRunner.rollbackTransaction()
            this.errRes(err, res, "Error accediendo a la base de datos", 409)
        }
        finally {
            // you need to release query runner which is manually created:
            await queryRunner.release()
        }
    }

    async getExcepAsistenciaPorObjetivo(
        req: any,
        res: Response
    ) {
        try {
            const objetivoId = req.params.objetivoId;
            const anio = req.params.anio;
            const mes = req.params.mes;
            var desde = new Date(anio, mes - 1, 1);

            //            const { objetivoId } = req.body;

            const result = await dataSource.query(
                `SELECT cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, TRIM(cat.CategoriaPersonalDescripcion) AS CategoriaPersonalDescripcion,
                IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde) AS Desde,
                IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta) AS Hasta
                
                FROM PersonalArt14 art 
                JOIN Personal per ON per.PersonalId = art.PersonalId
                JOIN Objetivo obj ON obj.ObjetivoId = art.PersonalArt14ObjetivoId
                LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = art.PersonalArt14TipoAsociadoId  AND cat.CategoriaPersonalId = art.PersonalArt14CategoriaId
                LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = per.PersonalCUITCUILUltNro
                WHERE obj.ObjetivoId = @0 
                -- AND (art.PersonalArt14AutorizadoDesde <= @1 OR art.PersonalArt14AutorizadoDesde IS NULL) AND (art.PersonalArt14Desde <= @1 OR art.PersonalArt14Desde IS NULL) 
                AND ((art.PersonalArt14AutorizadoDesde <= @1  AND (art.PersonalArt14AutorizadoHasta >= @1 OR art.PersonalArt14AutorizadoHasta is null)) OR (art.PersonalArt14Autorizado='N' AND (art.PersonalArt14Desde <= @1  AND (art.PersonalArt14Hasta >= @1 OR art.PersonalArt14Hasta is null))) )


                `, [objetivoId, desde]
            )
            this.jsonRes(result, res)
        }
        catch (err) {
            this.errRes(err, res, "Error accediendo a la base de datos", 409)
        }
    }

    async getMetodologia(
        req: any,
        res: Response
    ) {
        const recordSet = new Array()
        recordSet.push({ id: 'S', descripcion: 'Monto Fijo' })
        recordSet.push({ id: 'E', descripcion: 'Equivalencia' })
        recordSet.push({ id: 'A', descripcion: 'Monto Adicional por Hora' })
        recordSet.push({ id: 'H', descripcion: 'Horas Adicionales Mensuales' })

        this.jsonRes(recordSet, res)
    }

}
