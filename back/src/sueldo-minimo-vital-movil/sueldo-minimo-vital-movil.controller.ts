import { BaseController, ClientException, ClientWarning } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, getOptionsFromRequest, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";

const listaColumnas: any[] = [
  {
    id: 'id',
    name: 'id',
    field: 'id',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: 'SalarioMinimoVitalMovilDesde',
    name: 'AÑO/MES',
    field: 'SalarioMinimoVitalMovilDesde',
    fieldName: 'SalarioMinimoVitalMovilDesde',
    type: 'date',
    searchType: 'periodo',
    sortable: true,
    hidden: false,
    searchHidden: false,
    params: {
      dateFormat: 'YYYY-MM',
      outputFormat: 'YYYY-MM'
    }
  },
  {
    id: 'SalarioMinimoVitalMovilSMVM',
    name: 'Importe',
    field: 'SalarioMinimoVitalMovilSMVM',
    fieldName: 'SalarioMinimoVitalMovilSMVM',
    type: 'currency',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false,
    editor: {
      model: 'float'
    }
  }
];


export class SueldoMinimoVitalMovilController extends BaseController {

  async getGridCols(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(listaColumnas, res);
  }

  async getGridList(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction();

      const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
      const orderBy = orderToSQL(req.body.options.sort)
      const anio = req.body.options.anio
      const mes = req.body.options.mes

      const fecha = new Date(anio, mes - 1, 1, 0, 0, 0, 0);
      console.log("anio", anio)
      console.log("mes", mes)

     const lista: any[] = await queryRunner.query(`
      select smvm.SalarioMinimoVitalMovilId as id, smvm.SalarioMinimoVitalMovilDesde, smvm.SalarioMinimoVitalMovilSMVM
      from SalarioMinimoVitalMovil smvm
      where ${filterSql}
      ${orderBy}
      `, [fecha]);

      await queryRunner.commitTransaction();
      this.jsonRes({
        total: lista.length,
        list: lista
      }, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async addSMVM(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const SalarioMinimoVitalMovilDesde: Date = req.body.SalarioMinimoVitalMovilDesde ? new Date(req.body.SalarioMinimoVitalMovilDesde) : null;
    const SalarioMinimoVitalMovilSMVM: number = req.body.SalarioMinimoVitalMovilSMVM;
    
    try {
      await queryRunner.startTransaction();

      // Validaciones
      await this.validateFormSMVM(req.body, 'I', queryRunner);

      await queryRunner.query(`
        INSERT INTO SalarioMinimoVitalMovil (
          SalarioMinimoVitalMovilSMVM,
          SalarioMinimoVitalMovilCuotas,
          SalarioMinimoVitalMovilSuscripcionInicial,
          SalarioMinimoVitalMovilSuscripcionRestoCuotas,
          SalarioMinimoVitalMovilDesde,
          SalarioMinimoVitalMovilHasta
        ) VALUES (@0, @1, @2, @3, @4, @5)
      `, [
        SalarioMinimoVitalMovilSMVM,
        null, // SalarioMinimoVitalMovilCuotas
        null, // SalarioMinimoVitalMovilSuscripcionInicial
        null, // SalarioMinimoVitalMovilSuscripcionRestoCuotas
        SalarioMinimoVitalMovilDesde,
        null  // SalarioMinimoVitalMovilHasta
      ]);

      const SMVM = await queryRunner.query(`
        SELECT TOP 1 SalarioMinimoVitalMovilId 
        FROM SalarioMinimoVitalMovil
        WHERE SalarioMinimoVitalMovilDesde = @0
        ORDER BY SalarioMinimoVitalMovilId DESC
      `, [SalarioMinimoVitalMovilDesde]);
      
      const newId: number = SMVM[0]?.SalarioMinimoVitalMovilId || null;

      await queryRunner.commitTransaction();
      this.jsonRes({ SalarioMinimoVitalMovilId: newId }, res, 'Carga de nuevo registro exitoso');
    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async updateSMVM(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const SalarioMinimoVitalMovilId = req.body.SalarioMinimoVitalMovilId;
    const SalarioMinimoVitalMovilDesde: Date = req.body.SalarioMinimoVitalMovilDesde ? new Date(req.body.SalarioMinimoVitalMovilDesde) : null;
    const SalarioMinimoVitalMovilSMVM: number = req.body.SalarioMinimoVitalMovilSMVM;
    
    try {
      await queryRunner.startTransaction();

      // Validaciones
      await this.validateFormSMVM(req.body, 'U', queryRunner);

        // En actualización, no actualizar el período, solo el importe
        await queryRunner.query(`
          UPDATE SalarioMinimoVitalMovil SET
            SalarioMinimoVitalMovilSMVM = @1
        WHERE SalarioMinimoVitalMovilId = @0
      `, [SalarioMinimoVitalMovilId, SalarioMinimoVitalMovilSMVM]);

      await queryRunner.commitTransaction();
      this.jsonRes({}, res, 'Actualización de registro exitoso');
    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async onchangecellSMVM(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction();

      const row = req.body;

      // Si no tiene ID, es un nuevo registro
      if (!row.SalarioMinimoVitalMovilId) {
        // Validar antes de insertar
        await this.validateFormSMVM(row, 'I', queryRunner);
        
        const SalarioMinimoVitalMovilDesde: Date = row.SalarioMinimoVitalMovilDesde ? new Date(row.SalarioMinimoVitalMovilDesde) : null;
        const SalarioMinimoVitalMovilSMVM: number = row.SalarioMinimoVitalMovilSMVM;

        await queryRunner.query(`
          INSERT INTO SalarioMinimoVitalMovil (
            SalarioMinimoVitalMovilSMVM,
            SalarioMinimoVitalMovilCuotas,
            SalarioMinimoVitalMovilSuscripcionInicial,
            SalarioMinimoVitalMovilSuscripcionRestoCuotas,
            SalarioMinimoVitalMovilDesde,
            SalarioMinimoVitalMovilHasta
          ) VALUES (@0, @1, @2, @3, @4, @5)
        `, [
          SalarioMinimoVitalMovilSMVM,
          null, // SalarioMinimoVitalMovilCuotas
          null, // SalarioMinimoVitalMovilSuscripcionInicial
          null, // SalarioMinimoVitalMovilSuscripcionRestoCuotas
          SalarioMinimoVitalMovilDesde,
          null  // SalarioMinimoVitalMovilHasta
        ]);

        const SMVM = await queryRunner.query(`
          SELECT TOP 1 SalarioMinimoVitalMovilId 
          FROM SalarioMinimoVitalMovil
          WHERE SalarioMinimoVitalMovilDesde = @0
          ORDER BY SalarioMinimoVitalMovilId DESC
        `, [SalarioMinimoVitalMovilDesde]);

        const newId: number = SMVM[0]?.SalarioMinimoVitalMovilId || null;
        
        await queryRunner.commitTransaction();
        this.jsonRes({ SalarioMinimoVitalMovilId: newId }, res);
      } else {
        // Es una actualización
        await this.validateFormSMVM(row, 'U', queryRunner);

        const SalarioMinimoVitalMovilDesde: Date = row.SalarioMinimoVitalMovilDesde ? new Date(row.SalarioMinimoVitalMovilDesde) : null;
        const SalarioMinimoVitalMovilSMVM: number = row.SalarioMinimoVitalMovilSMVM;

        // En actualización, no actualizar el período, solo el importe
        await queryRunner.query(`
          UPDATE SalarioMinimoVitalMovil SET
            SalarioMinimoVitalMovilSMVM = @1
          WHERE SalarioMinimoVitalMovilId = @0
        `, [row.SalarioMinimoVitalMovilId, SalarioMinimoVitalMovilSMVM]);

        await queryRunner.commitTransaction();
        this.jsonRes({}, res);
      }
    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async  validateFormSMVM(smvm: any, action: string, queryRunner: any) {
    let error: string[] = [];
    
    if (!smvm.SalarioMinimoVitalMovilDesde) {
      error.push(' AÑO/MES');
    }
    if (smvm.SalarioMinimoVitalMovilSMVM === null || smvm.SalarioMinimoVitalMovilSMVM === undefined) {
      error.push(' Importe');
    }

    if (error.length) {
      error.unshift('Deben completar los siguientes campos:');
      throw new ClientWarning(error);
    }

    // Validar que el importe sea mayor a 0
    const importe = Number(smvm.SalarioMinimoVitalMovilSMVM);
    if (isNaN(importe) || importe <= 0) {
      throw new ClientException('El importe debe ser mayor a 0');
    }

    const fecha = new Date(smvm.SalarioMinimoVitalMovilDesde);
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth() + 1;

    // Validar que no haya duplicados en el mismo periodo (año/mes)
    if (action == 'I') {
      const existing = await queryRunner.query(`
        SELECT SalarioMinimoVitalMovilId AS id 
        FROM SalarioMinimoVitalMovil 
        WHERE YEAR(SalarioMinimoVitalMovilDesde) = @0 
        AND MONTH(SalarioMinimoVitalMovilDesde) = @1
      `, [anio, mes]);
      
      if (existing.length) {
        throw new ClientException('Ya existe un registro para ese período (año/mes)');
      }

      // Validar que el periodo sea consecutivo al último registro
      const ultimoPeriodo = await queryRunner.query(`
        SELECT TOP 1 SalarioMinimoVitalMovilDesde
        FROM SalarioMinimoVitalMovil
        ORDER BY SalarioMinimoVitalMovilDesde DESC
      `);

      if (ultimoPeriodo.length > 0) {
        const ultimaFecha = new Date(ultimoPeriodo[0].SalarioMinimoVitalMovilDesde);
        const siguienteEsperado = new Date(ultimaFecha);
        siguienteEsperado.setMonth(siguienteEsperado.getMonth() + 1);
        siguienteEsperado.setDate(1);

        // Comparar solo año y mes
        if (fecha.getFullYear() !== siguienteEsperado.getFullYear() || 
            fecha.getMonth() !== siguienteEsperado.getMonth()) {
          const siguienteAnio = siguienteEsperado.getFullYear();
          const siguienteMes = String(siguienteEsperado.getMonth() + 1).padStart(2, '0');
          throw new ClientException(`El período debe ser consecutivo. El siguiente período esperado es: ${siguienteAnio}-${siguienteMes}`);
        }
      }
    }

    if (action == 'U') {
      // En actualización, no permitir cambiar el período, solo el importe
      const registroActual = await queryRunner.query(`
        SELECT SalarioMinimoVitalMovilDesde
        FROM SalarioMinimoVitalMovil
        WHERE SalarioMinimoVitalMovilId = @0
      `, [smvm.SalarioMinimoVitalMovilId]);

      if (registroActual.length > 0) {
        const fechaActual = new Date(registroActual[0].SalarioMinimoVitalMovilDesde);
        if (fecha.getFullYear() !== fechaActual.getFullYear() || 
            fecha.getMonth() !== fechaActual.getMonth()) {
          throw new ClientException('No se puede modificar el período (AÑO/MES) de un registro existente. Solo se puede editar el importe.');
        }
      }
    }
  }

  async getUltimoPeriodo(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const ultimoPeriodo = await queryRunner.query(`
        SELECT TOP 1 SalarioMinimoVitalMovilDesde
        FROM SalarioMinimoVitalMovil
        ORDER BY SalarioMinimoVitalMovilDesde DESC
      `);

      if (ultimoPeriodo.length > 0) {
        this.jsonRes(ultimoPeriodo[0].SalarioMinimoVitalMovilDesde, res);
      } else {
        this.jsonRes(null, res);
      }
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async rollbackTransaction(queryRunner: any) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
  }

  async deleteSMVM(req: any, res: Response, next: NextFunction) {


  const SalarioMinimoVitalMovilId = req.params.SalarioMinimoVitalMovilId;

  if (!SalarioMinimoVitalMovilId) {
    throw new ClientException('El ID del registro es requerido');
  }

//throw new ClientException('test');
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction();
      await queryRunner.query(`DELETE FROM SalarioMinimoVitalMovil WHERE SalarioMinimoVitalMovilId = @0`, [req.params.SalarioMinimoVitalMovilId]);
      await queryRunner.commitTransaction();
      this.jsonRes({}, res, 'Registro eliminado exitoso');
    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }
}
