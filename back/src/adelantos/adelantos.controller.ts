import { Request, Response } from "express";
import { BaseController } from "../controller/baseController";
import { dataSource } from "../data-source";


export class AdelantosController extends BaseController {
    async getByPersonalId(
        PersonalId: string, Año: string, Mes: string,
        res: Response
    ) {
        try {
            
            const result = await dataSource.query(
                `SELECT * From PersonalAdelanto ade 
                WHERE (ade.PersonalAdelantoAprobado ='N' OR ade.PersonalAdelantoAplicaEl= CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/','@1'))
                AND ade.PersonalId = @0`, [PersonalId, Año, Mes]
            )
            this.jsonRes(result, res)
        }
        catch (err) {
            this.errRes(err, res, "Error accediendo a la base de datos", 409)
        }
    }

    async setAdelanto(req: Request, res: Response) {
        const queryRunner = dataSource.createQueryRunner()
        try {
            await queryRunner.connect()
            await queryRunner.startTransaction()
// Max Val
//Hay ya un adelanto sin aprob
// Si hay, lo reemplazas
            const result = await queryRunner.query(
                `INSERT INTO PersonalArt14(PersonalArt14Id, PersonalArt14FormaArt14, PersonalArt14SumaFija, PersonalArt14AdicionalHora, PersonalArt14Horas, PersonalArt14Porcentaje, PersonalArt14Desde, 
                    PersonalArt14Hasta, PersonalArt14Autorizado, PersonalArt14AutorizadoDesde, PersonalArt14AutorizadoHasta, PersonalArt14Anulacion, PersonalArt14Puesto, PersonalArt14Dia, PersonalArt14Tiempo, PersonalId, 
                    PersonalArt14TipoAsociadoId, PersonalArt14CategoriaId, PersonalArt14ConceptoId, PersonalArt14ObjetivoId, PersonalArt14QuienAutorizoId, PersonalArt14UsuarioId) 
                    VALUES(@0, @1, 
                    @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17, @18, @19, @20, @21)
                `, [])
            await queryRunner.commitTransaction()
        } catch (error) {
            await queryRunner.rollbackTransaction()
        }
        finally {
            await queryRunner.release()
        }
    }
    
}
