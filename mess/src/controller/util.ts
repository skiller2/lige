import { QueryRunner } from "typeorm";

export class Utils {
  static async getMovimientoId(queryRunner: QueryRunner) {
    const movimientomax = await queryRunner.query(`SELECT MAX(mov.movimiento_id) max_movimiento_id FROM lige.dbo.liqmamovimientos mov`)
    return (movimientomax[0].max_movimiento_id != undefined) ? movimientomax[0].max_movimiento_id : 0
  }
  static async getImpoexpoId(queryRunner: QueryRunner) {
    const impoexpomax = await queryRunner.query(`SELECT MAX(imp.impoexpo_id) max_impoexpo_id FROM lige.dbo.convalorimpoexpo imp`)
    return (impoexpomax[0].max_impoexpo_id != undefined) ? impoexpomax[0].max_impoexpo_id : 0
  }

  static async getPeriodoId(queryRunner: QueryRunner, fechaActual: Date, anio: number, mes: number, usuario: any, ip: any) {
    let periodo_id = 0
    const periodo = await queryRunner.query(
      `SELECT per.periodo_id, per.anio, per.mes
       FROM lige.dbo.liqmaperiodo per
       WHERE per.anio = @0 AND per.mes = @1`,
      [anio, mes]
    )

    if (periodo.length == 0) {
      //Falla en el primer periodo
      const periodomax = await queryRunner.query(`SELECT MAX(per.periodo_id) max_periodo_id FROM lige.dbo.liqmaperiodo per`)
      periodo_id = (periodomax[0].max_periodo_id != undefined) ? periodomax[0].max_periodo_id : 0
      periodo_id++

    } else
      periodo_id = periodo[0].periodo_id
    return periodo_id
  }

  static waitT = (ms: number) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(ms)
      }, ms)
    })
  }

}