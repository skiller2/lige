import { ClientException } from "../controller/basecontroller.ts";
import { QueryFailedError, QueryRunner } from "typeorm";

export class Utils {
  static async getMovimientoId(queryRunner: QueryRunner) {
    const movimientomax = await queryRunner.query(`SELECT MAX(mov.movimiento_id) max_movimiento_id FROM lige.dbo.liqmamovimientos mov`)
    return (movimientomax[0].max_movimiento_id != undefined) ? movimientomax[0].max_movimiento_id : 0
  }
  static async getImpoexpoId(queryRunner: QueryRunner) {
    const impoexpomax = await queryRunner.query(`SELECT MAX(imp.impoexpo_id) max_impoexpo_id FROM lige.dbo.convalorimpoexpo imp`)
    return (impoexpomax[0].max_impoexpo_id != undefined) ? impoexpomax[0].max_impoexpo_id : 0
  }

  
static getNextPeriodo(anio: number, mes: number): {anio: number, mes: number} {
  if (mes === 12) {
    return { anio: anio + 1, mes: 1 };
  }
  return { anio, mes: mes + 1 };
}


  static async getPeriodoId(queryRunner: QueryRunner, fechaActual: Date, anio: number, mes: number, usuario: any, ip: any) {
    if (anio == 0 || mes == 0)
      throw new ClientException(`Período no válido ${mes}/${anio}`)

    const periodo = await queryRunner.query(
      `SELECT per.periodo_id, per.anio, per.mes
       FROM lige.dbo.liqmaperiodo per
       WHERE per.anio = @0 AND per.mes = @1`,
      [anio, mes]
    )

    if (periodo.length == 1)
      return periodo[0].periodo_id

    const aniomesmax = await queryRunner.query(`SELECT TOP 1 periodo_id, anio, mes FROM lige.dbo.liqmaperiodo ORDER BY anio DESC, mes DESC `)
    const anioMax = (aniomesmax.length > 0) ? aniomesmax[0].anio : 0
    const mesMax = (aniomesmax.length > 0) ? aniomesmax[0].mes : 0
    const { anio: proxAnio, mes: proxMes } = Utils.getNextPeriodo(anioMax, mesMax)
    if (anio !== proxAnio || mes !== proxMes)
      throw new ClientException(`Período no válido ${mes}/${anio}. El próximo período es ${proxMes}/${proxAnio}`)

    const periodomax = await queryRunner.query(`SELECT MAX(per.periodo_id) max_periodo_id FROM lige.dbo.liqmaperiodo per`)
    let periodo_id = (periodomax[0].max_periodo_id != undefined) ? periodomax[0].max_periodo_id : 0
    periodo_id++

    await queryRunner.query(
      `INSERT INTO lige.dbo.liqmaperiodo (periodo_id, anio, mes, version, ind_recibos_generados, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
            VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10) `,
      [
        periodo_id,
        anio,
        mes,
        0,
        0,
        usuario,
        ip,
        fechaActual,
        usuario,
        ip,
        fechaActual,
      ]
    );
    return periodo_id
  }

}

