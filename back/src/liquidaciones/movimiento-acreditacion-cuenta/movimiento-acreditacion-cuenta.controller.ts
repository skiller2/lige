import { BaseController, ClientException } from "../../controller/baseController";
import { dataSource } from "../../data-source";
import { QueryFailedError } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { ParsedQs } from "qs";


export class MovimientoAcreditacionEnCuentaController extends BaseController {

 
  async procesaCambios(req: any, res: Response, next: NextFunction) {
    const options = {}

    const queryRunner = dataSource.createQueryRunner();
    let fechaActual = new Date()
    fechaActual.setHours(0, 0, 0, 0)

    let fechaAyer = new Date()
    fechaAyer.setDate(fechaAyer.getDate() - 1);
    fechaAyer.setHours(0, 0, 0, 0)

    try {
    //   await queryRunner.connect();
    //   await queryRunner.startTransaction();

    //   const pendientes = await MovimientosAutomaticosController.listCambiosPendCategoria(options)

    //   for (const persona of pendientes) {

    //     if (persona.fechaCambio > fechaActual) continue

    //     const catactual = await queryRunner.query(
    //       `
    //     SELECT per.PersonalCategoriaUltNro as max, cat.TipoJornadaId, cat.SucursalId, cat.SucursalAreaId
    //     FROM Personal per
    //     JOIN PersonalCategoria cat ON cat.PersonalCategoriaTipoAsociadoId=@1 AND cat.PersonalCategoriaPersonalId=per.PersonalId AND ISNULL(cat.PersonalCategoriaHasta, '9999-12-31') >= @3 AND  cat.PersonalCategoriaDesde <= @3 
    //     WHERE per.PersonalId = @0`,
    //       [persona.PersonalId, persona.TipoAsociadoIdCambio, '', fechaActual
    //       ]
    //     )


        

    //     if (catactual.length == 0) continue
    //     const PersonalCategoriaUltNro = catactual[0].max + 1;


        
    //     const TipoJornadaId = catactual[0].TipoJornadaId
    //     const SucursalId = catactual[0].SucursalId
    //     const SucursalAreaId = catactual[0].SucursalAreaId

    //     await queryRunner.query(
    //       `UPDATE Personal SET PersonalCategoriaUltNro=@1 WHERE PersonalId=@0 `,
    //       [
    //         persona.PersonalId,
    //         PersonalCategoriaUltNro,
    //       ]
    //     );

    //     await queryRunner.query(
    //       `
    //       UPDATE PersonalCategoria SET PersonalCategoriaHasta =@0 WHERE PersonalCategoriaTipoAsociadoId=@1 AND PersonalCategoriaPersonalId=@2 AND ISNULL(PersonalCategoriaHasta,'9999-12-31') >= @3 AND  PersonalCategoriaDesde <= @3 `,
    //       [
    //         fechaAyer,
    //         persona.TipoAsociadoIdCambio,
    //         persona.PersonalId,
    //         fechaActual,
    //       ]
    //     );

    //     await queryRunner.query(
    //       `INSERT INTO PersonalCategoria (PersonalCategoriaId, PersonalCategoriaPersonalId, PersonalCategoriaTipoAsociadoId, PersonalCategoriaCategoriaPersonalId, PersonalCategoriaDesde, PersonalCategoriaHasta, TipoJornadaId, SucursalId, SucursalAreaId)
    //          VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8)
    //                 `,
    //       [
    //         PersonalCategoriaUltNro,
    //         persona.PersonalId,
    //         persona.TipoAsociadoIdCambio,
    //         persona.CategoriaPersonalIdCambio,
    //         fechaActual,
    //         null,
    //         TipoJornadaId,
    //         SucursalId,
    //         SucursalAreaId,
    //       ]
    //     );

    //   }

    //   await queryRunner.commitTransaction();
      return next(`Se procesaron cambios `)
    } catch (error) {
      this.rollbackTransaction(queryRunner)
//      return next(error)
    return next(`Se procesaron cambios `)
    } finally {
        return next(`Se procesaron cambios `)
    //   await queryRunner.release();
    }
  }
}
