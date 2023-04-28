import { Request, Response } from "express";
import { BaseController } from "../controller/baseController";
import { dataSource } from "../data-source";


export class AdelantosController extends BaseController {
    async getByPersonalId(
        personalId: string, Año: string, Mes: string,
        res: Response
    ) {
        try {

            const result = await dataSource.query(
                `SELECT * From PersonalAdelanto ade 
                WHERE (ade.PersonalAdelantoAprobado IN (NULL, 'S') OR ade.PersonalAdelantoAplicaEl= CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1))
                AND ade.PersonalId = @0`, [personalId, Año, Mes]
            )
            this.jsonRes(result, res)
        }
        catch (err) {
            this.errRes(err, res, "Error accediendo a la base de datos", 409)
        }
    }

    async setAdelanto(personalId: string, monto: number, ip, res: Response) {
        const queryRunner = dataSource.createQueryRunner()
        try {
            await queryRunner.connect()
            await queryRunner.startTransaction()
            // Max Val
            //Hay ya un adelanto sin aprob
            // Si hay, lo reemplazas
            const adelantoId = (await queryRunner.query(`
            SELECT MAX(ade.PersonalAdelantoId) as max FROM PersonalAdelanto ade WHERE ade.PersonalId = @0`, [personalId]))[0].max
            const adelantoExistente = await dataSource.query(
                `DELETE From PersonalAdelanto 
                WHERE (PersonalAdelantoAprobado IN (NULL))
                AND PersonalId = @0`, [personalId]
            )
            const result = await queryRunner.query(
                `INSERT INTO PersonalAdelanto(
                    PersonalAdelantoId, PersonalId, PersonalAdelantoMonto, PersonalAdelantoFechaSolicitud, PersonalAdelantoAprobado, PersonalAdelantoFechaAprobacion, PersonalAdelantoCantidadCuotas, PersonalAdelantoAplicaEl, PersonalAdelantoLiquidoFinanzas, PersonalAdelantoUltimaLiquidacion, PersonalAdelantoCuotaUltNro, PersonalAdelantoMontoAutorizado, PersonalAdelantoJerarquicoId, PersonalAdelantoPuesto, PersonalAdelantoUsuarioId, PersonalAdelantoDia, PersonalAdelantoTiempo) VALUES(@0, @1, 
                    @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16)
                `, [adelantoId, personalId, monto, (new Date()), null, null, null, 1, null, '', null, 0, null, ip, null, null])
            await queryRunner.commitTransaction()
        } catch (error) {
            await queryRunner.rollbackTransaction()
        }
        finally {
            await queryRunner.release()
        }
    }

}
