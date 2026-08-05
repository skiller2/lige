import type { QueryRunner } from "typeorm";
import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Response } from "express";

export class DomicilioController extends BaseController {
    test(req: any, res: any, next: any) {
        throw new Error("Method not implemented.");
    }

    async getProvinciaId(queryRunner: QueryRunner, state: string) {
        const provincias = await queryRunner.query(`SELECT ProvinciaId,ProvinciaDescripcion FROM Provincia WHERE PaisId  = 1 AND ProvinciaDescripcion COLLATE Latin1_General_CI_AI = @0`, [state])
        if (provincias.length !== 1)
            throw new Error(`Provincia "${state}" no encontrada.`);
        return provincias[0].ProvinciaId;
    }

    async getLocalidadId(queryRunner: QueryRunner, ProvinciaId: number, LocalidadDescripcion1: string, LocalidadDescripcion2: string) {
        LocalidadDescripcion2 = String(LocalidadDescripcion2).replace(/^Partido de\s*/i, "").trim();

        const localidades = await queryRunner.query(`SELECT LocalidadId,LocalidadDescripcion FROM Localidad WHERE ProvinciaId = @0 AND (LocalidadDescripcion COLLATE Latin1_General_CI_AI= @1 OR LocalidadDescripcion COLLATE Latin1_General_CI_AI= @2)`, [ProvinciaId, LocalidadDescripcion1, LocalidadDescripcion2])
        if (localidades.length == 0)
            throw new Error(`Localidad "${LocalidadDescripcion1} o ${LocalidadDescripcion2}" no encontrada.`);
        return localidades[0].LocalidadId;
    }
    async getBarrioId(queryRunner: QueryRunner, ProvinciaId: number, LocalidadId: number, BarrioDescripcion: string) {
        const barrios = await queryRunner.query(`SELECT BarrioId,BarrioDescripcion FROM Barrio WHERE ProvinciaId = @0 AND LocalidadId = @1 AND BarrioDescripcion = @2`, [ProvinciaId, LocalidadId, BarrioDescripcion])
        if (barrios.length !== 1)
            //throw new Error(`Barrio "${BarrioDescripcion}" no encontrado.`);
            return null
        return barrios[0].BarrioId;
    }


    static waitT = (ms: number) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(ms)
            }, ms)
        })
    }


    async getDireccionNominatim(direccion: string) {
        const url = new URL("https://nominatim.openstreetmap.org/search");

        url.searchParams.append("q", direccion);
        url.searchParams.append("polygon_geojson", "1");
        url.searchParams.append("countrycodes", "AR");
        url.searchParams.append("layer", "address");
        url.searchParams.append("limit", "10");
        url.searchParams.append("format", "jsonv2");
        url.searchParams.append("addressdetails", "1");

        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "Accept-Language": "es-ES",
                "User-Agent": "Lige/1.0 (info@linceseguridad.com.ar)"
            }
        });

        if (!response.ok) {
            if (response.status === 429) {
                throw new ClientException(`Error HTTP ${response.status}: Demasiadas solicitudes a Nominatim.`, { status: response.status }, 429);
            }

            throw new Error(`Error HTTP ${response.status}`);
        }

        let result: any = await response.json()

        result = result.filter((item: any) => item.address?.road);

        result.forEach((item: any) => {
            const { road, house_number, town, state, state_district, postcode } = item.address || {};

            item.display_name = [
                [road, house_number].filter(Boolean).join(" "),
                state_district || town,
                state,
                postcode
            ]
                .filter(Boolean)
                .join(", ");
        });

        return result

    }


    async jobUpdateDirecciones(req: any, res: Response, next: NextFunction) {
        const usuario = this.getUser(res)
        const queryRunner = await getConnection(usuario);
        const ip = this.getRemoteAddress(req)

        let registrosActualizados = 0
        let registrosProcesados = 0
        let EventoLogCodigo = 0


        try {
            ({ EventoLogCodigo } = await this.eventoLogInicio(
                queryRunner,
                `Normalizar Direcciones`,
                { usuario, ip },
                usuario,
                ip,
                "HAB"
            ));

            const direcciones = await queryRunner.query(`SELECT dom.DomicilioId 

                ,TRIM(dom.DomicilioDomCalle) Calle,
                TRIM(dom.DomicilioDomNro) DomicilioDomNro,
                TRIM(dom.DomicilioCodigoPostal) DomicilioCodigoPostal,
                TRIM(pais.PaisDescripcion) pais, 
                TRIM(prov.ProvinciaDescripcion) provincia,
                TRIM(loc.LocalidadDescripcion) localidad ,
                TRIM(bar.BarrioDescripcion) barrio,
                CONCAT_WS(', ', CONCAT_WS(' ',NULLIF(TRIM(dom.DomicilioDomCalle), ''),NULLIF(TRIM(dom.DomicilioDomNro), '')), TRIM(dom.DomicilioCodigoPostal),
                NULLIF(TRIM(bar.BarrioDescripcion), ''),NULLIF(TRIM(loc.LocalidadDescripcion), ''),NULLIF(TRIM(prov.ProvinciaDescripcion), ''),NULLIF(TRIM(pais.PaisDescripcion), '')) AS domNormalizar,
                dom.DomicilioJson

                FROM Domicilio dom
                JOIN NexoDomicilio nex ON nex.DomicilioId=dom.DomicilioId

                LEFT JOIN Pais pais on pais.PaisId=dom.DomicilioPaisId
                LEFT JOIN Provincia prov on prov.PaisId=pais.PaisId and prov.ProvinciaId=dom.DomicilioProvinciaId
                LEFT JOIN Localidad loc on loc.PaisId=pais.PaisId and loc.ProvinciaId=prov.ProvinciaId  and loc.LocalidadId=dom.DomicilioLocalidadId 
                LEFT JOIN Barrio bar on bar.PaisId=pais.PaisId and prov.ProvinciaId=bar.ProvinciaId and loc.LocalidadId=bar.LocalidadId and dom.DomicilioBarrioId=bar.BarrioId

                WHERE dom.DomicilioJson IS NULL AND nex.NexoDomicilioActual = 1`)



            for (const direccion of direcciones) {
                registrosProcesados++
                const domNormalizar = direccion.domNormalizar
                const DomicilioId = direccion.DomicilioId
                let nominatimResult: any = []
                await DomicilioController.waitT(1000)
                try {
                    nominatimResult = await this.getDireccionNominatim(domNormalizar)
                } catch (error) {
                    continue
                }
                if (nominatimResult.length != 1) {
                    await queryRunner.query(`
                                    UPDATE Domicilio SET DomicilioJson = @1
                                    WHERE DomicilioId =@0
                                `, [DomicilioId, `ERROR Coincidencias ${nominatimResult.length}`])
                    continue
                }

                const DomicilioJson = nominatimResult[0]
                const DomicilioCodigoPostal = DomicilioJson.address.postcode
                const DomicilioCompleto = DomicilioJson.display_name
                const DomicilioDomCalle = DomicilioJson.address.road
                const DomicilioDomNro = DomicilioJson.address.house_number
                let DomicilioProvinciaId = null
                let DomicilioLocalidadId = null
                try {
                    DomicilioProvinciaId = await this.getProvinciaId(queryRunner, DomicilioJson.address.state) // Buscarlo en provincias
                } catch (error) {
                    await queryRunner.query(`
                                    UPDATE Domicilio SET DomicilioJson = @1
                                    WHERE DomicilioId =@0
                                `, [DomicilioId, `ERROR Provincia "${DomicilioJson.address.state}" no encontrada`])
                    continue
                }
                try {
                    DomicilioLocalidadId = (DomicilioProvinciaId == 25) ? 1 : await this.getLocalidadId(queryRunner, DomicilioProvinciaId, DomicilioJson.address.city, DomicilioJson.address.state_district) //Busco  LocalidadId en base a la provincia y el nombre de la localidad
                } catch (error) {
                    await queryRunner.query(`
                                    UPDATE Domicilio SET DomicilioJson = @1
                                    WHERE DomicilioId =@0
                                `, [DomicilioId, `ERROR Localidad "${DomicilioJson.address.city} o ${DomicilioJson.address.state_district}" no encontrada`])
                    continue
                }

                const DomicilioBarrioId = await this.getBarrioId(queryRunner, DomicilioProvinciaId, DomicilioLocalidadId, DomicilioJson.address.suburb)
                const DomicilioPaisId = 1 // Argentina
                await queryRunner.query(`
                                    UPDATE Domicilio SET DomicilioJson = @1,  DomicilioCompleto = @2, DomicilioCodigoPostal = @3, DomicilioDomCalle = @4, DomicilioDomNro = @5, DomicilioProvinciaId = @6, DomicilioLocalidadId = @7, DomicilioBarrioId = @8, DomicilioPaisId =@9
                                    WHERE DomicilioId =@0
                                `, [DomicilioId, JSON.stringify(DomicilioJson), DomicilioCompleto, DomicilioCodigoPostal, DomicilioDomCalle, DomicilioDomNro, DomicilioProvinciaId, DomicilioLocalidadId, DomicilioBarrioId, DomicilioPaisId])

                registrosActualizados++
            }


            await this.eventoLogFin(
                queryRunner,
                EventoLogCodigo,
                'COM',
                {
                    res: `Procesado correctamente`,
                    'Registros Actualizados': registrosActualizados,
                    'Registros Procesados': registrosProcesados
                },
                usuario,
                ip
            );

            this.jsonRes({ registrosActualizados }, res, `Direcciones normalizadas ${registrosActualizados}`);

        } catch (error) {
            console.log("Error en jobUpdateDirecciones:", error)
            await this.rollbackTransaction(queryRunner)
            await this.eventoLogFin(queryRunner,
                EventoLogCodigo,
                'ERR',
                { res: error, 'Registros Procesados': registrosProcesados, 'Registros Actualizados': registrosActualizados },
                usuario,
                ip
            );
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

  private async getPaisesQuery(queryRunner:any){
    return await queryRunner.query(
      `SELECT pais.PaisId value, TRIM(pais.PaisDescripcion) label
      FROM Pais pais`
    )
  }
  
  async getPaises(req: any, res: Response, next: NextFunction){
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options = await this.getPaisesQuery(queryRunner)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  private async getProvinciasByPaisQuery(queryRunner:any, paisId:number){
    return await queryRunner.query(
      `SELECT pro.ProvinciaId value, TRIM(pro.ProvinciaDescripcion) label
      FROM Provincia pro
      WHERE PaisId IN (@0)`, 
      [paisId]
    )
  }
  
  async getProvinciasByPais(req: any, res: Response, next: NextFunction){
    const queryRunner = await getConnection(res.locals.userName);
    const paisId:number = req.body.paisId
    try {
      const options = await this.getProvinciasByPaisQuery(queryRunner, paisId)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  private async getLocalidadesByProvinciaQuery(queryRunner:any, paisId:number, provinciaId:number){
    return await queryRunner.query(
      `SELECT loc.LocalidadId value, TRIM(loc.LocalidadDescripcion) label
      FROM Localidad loc
      WHERE loc.PaisId IN (@0) AND loc.ProvinciaId IN (@1)`,
      [paisId, provinciaId]
    )
  }
  
  async getLocalidadByProvincia(req: any, res: Response, next: NextFunction){
    const queryRunner = await getConnection(res.locals.userName);
    const provinciaId:number = req.body.provinciaId
    const paisId:number = req.body.paisId
    try {
      const options = await this.getLocalidadesByProvinciaQuery(queryRunner, paisId, provinciaId)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  private async getBarrioByLocalidadQuery(queryRunner:any, paisId:number, provinciaId:number, localidadId:number){
    return await queryRunner.query(
      `SELECT bar.BarrioId value, TRIM(bar.BarrioDescripcion) label
      FROM Barrio bar
      WHERE bar.PaisId IN (@0) AND bar.ProvinciaId IN (@1) AND bar.LocalidadId IN (@2)`,
      [paisId, provinciaId, localidadId]
    )
  }

  async getBarrioByLocalidad(req: any, res: Response, next: NextFunction){
    const queryRunner = await getConnection(res.locals.userName);
    const localidadId:number = req.body.localidadId
    const provinciaId:number = req.body.provinciaId
    const paisId:number = req.body.paisId
    try {
      const options = await this.getBarrioByLocalidadQuery(queryRunner, paisId, provinciaId, localidadId)
      
      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }
  
  async getProvincias(req: any, res: Response, next: NextFunction){
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options = await queryRunner.query(
        `SELECT pro.ProvinciaId, pro.PaisId, TRIM(pro.ProvinciaDescripcion) label
          , pro.ProvinciaId AS value
          , CONCAT(TRIM(pro.ProvinciaDescripcion), ', ', TRIM(pais.PaisDescripcion)) address
        FROM Provincia pro
        INNER JOIN Pais pais ON pais.PaisId = pro.PaisId
        where pais.PaisId = 1`,
      )

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }
  
  async getLocalidad(req: any, res: Response, next: NextFunction){
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options = await queryRunner.query(
        `SELECT loc.LocalidadId, loc.PaisId, loc.ProvinciaId, TRIM(loc.LocalidadDescripcion) label
          , loc.LocalidadId value
          , CONCAT_WS(', ', TRIM(loc.LocalidadDescripcion), TRIM(pro.ProvinciaDescripcion), TRIM(pais.PaisDescripcion)) address
        FROM Localidad loc
        INNER JOIN Provincia pro ON pro.ProvinciaId = loc.ProvinciaId AND pro.PaisId = loc.PaisId
        INNER JOIN Pais pais ON pais.PaisId = loc.PaisId
        where pais.PaisId = 1`
      )

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  async getBarrio(req: any, res: Response, next: NextFunction){
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options = await queryRunner.query(
        `SELECT bar.BarrioId, bar.LocalidadId, bar.PaisId, bar.ProvinciaId, TRIM(bar.BarrioDescripcion) label
          , bar.BarrioId value
          , CONCAT_WS(', ', TRIM(bar.BarrioDescripcion), TRIM(loc.LocalidadDescripcion), TRIM(pro.ProvinciaDescripcion), TRIM(pais.PaisDescripcion)) address
        FROM Barrio bar
        INNER JOIN Localidad loc ON loc.LocalidadId = bar.LocalidadId AND loc.ProvinciaId = bar.ProvinciaId AND loc.PaisId = bar.PaisId
        INNER JOIN Provincia pro ON pro.ProvinciaId = bar.ProvinciaId AND pro.PaisId = bar.PaisId
        INNER JOIN Pais pais ON pais.PaisId = bar.PaisId
        where pais.PaisId = 1`
      )
      
      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  async searchProvincia(req: any, res: Response, next: NextFunction){
    const { PaisId, fieldName, value } = req.body;
    if (PaisId == "") {
      this.jsonRes({ objetivos: [] }, res);
      return;
    }
    let buscar = false;
    let query = `
      SELECT pro.ProvinciaId, TRIM(pro.ProvinciaDescripcion) Descripcion
      FROM Provincia pro
      WHERE 
    `;

    if (PaisId > 0)
      query += 'pro.PaisId IN (@0) AND '

    switch (fieldName) {
      case "Descripcion":
        if (value.trim().length > 1) {
          query += ` (pro.ProvinciaDescripcion LIKE '%${value.trim()}%') AND `;
          buscar = true;
        }
        break;
      default:
        break;
    }

    if (buscar == false) {
      this.jsonRes({ recordsArray: [] }, res);
      return;
    }

    const queryRunner = await getConnection(res.locals.userName);
    queryRunner.query((query += " 1=1"), [PaisId])
    .then(async (records) => {
      await queryRunner.release()

      this.jsonRes({ recordsArray: records }, res);
    }).catch((error) => {
      return next(error)
    });
  }
  
  async searchLocalidad(req: any, res: Response, next: NextFunction){
    const { PaisId, ProvinciaId, fieldName, value } = req.body;
    if (PaisId == "" || ProvinciaId == "") {
      this.jsonRes({ objetivos: [] }, res);
      return;
    }
    let buscar = false;
    let query = `
      SELECT loc.LocalidadId, TRIM(loc.LocalidadDescripcion) Descripcion
      FROM Localidad loc
      WHERE 
    `;

    if (PaisId > 0)
      query += 'loc.PaisId IN (@0) AND '
    if (ProvinciaId > 0)
      query += 'loc.ProvinciaId IN (@1) AND '

    switch (fieldName) {
      case "Descripcion":
        if (value.trim().length > 1) {
          query += ` (loc.LocalidadDescripcion LIKE '%${value.trim()}') AND `;
          buscar = true;
        }
        break;
      default:
        break;
    }

    if (buscar == false) {
      this.jsonRes({ recordsArray: [] }, res);
      return;
    }

    const queryRunner = await getConnection(res.locals.userName);
    queryRunner.query((query += " 1=1"), [PaisId, ProvinciaId])
    .then(async (records) => {
      await queryRunner.release()

      this.jsonRes({ recordsArray: records }, res);
    }).catch((error) => {
      return next(error)
    });
  }

  async searchBarrio(req: any, res: Response, next: NextFunction){
    const { PaisId, ProvinciaId, LocalidadId, fieldName, value } = req.body;
    if (PaisId == "" || ProvinciaId == "" || LocalidadId == "") {
      this.jsonRes({ objetivos: [] }, res);
      return;
    }
    let buscar = false;
    let query = `
      SELECT bar.BarrioId, TRIM(bar.BarrioDescripcion) Descripcion
      FROM Barrio bar
      WHERE 
    `;

    if (PaisId > 0)
      query += 'bar.PaisId IN (@0) AND '
    if (ProvinciaId > 0)
      query += 'bar.ProvinciaId IN (@1) AND '
    if (LocalidadId > 0)
      query += 'bar.LocalidadId IN (@1) AND '

    switch (fieldName) {
      case "Descripcion":
        if (value.trim().length > 1) {
          query += ` (bar.BarrioDescripcion LIKE '%${value.trim()}') AND `;
          buscar = true;
        }
        break;
      default:
        break;
    }

    if (buscar == false) {
      this.jsonRes({ recordsArray: [] }, res);
      return;
    }

    const queryRunner = await getConnection(res.locals.userName);
    queryRunner.query((query += " 1=1"), [PaisId, ProvinciaId, LocalidadId])
    .then(async (records) => {
      await queryRunner.release()

      this.jsonRes({ recordsArray: records }, res);
    }).catch((error) => {
      return next(error)
    });
  }

  // Valida el objeto que devuelve AddrSearchComponent
  async valObjDomicilio(queryRunner:any, domicilio:any){
    if (!domicilio.address || Object.keys(domicilio.address).length === 0) {
      throw new ClientException(`Domicilio invalido`)
    }

    if (!domicilio.display_name || domicilio.display_name.length === 0) {
      throw new ClientException(`Domicilio invalido`)
    }

    if (!domicilio.place_id || isNaN(domicilio.place_id)) {
      throw new ClientException(`Domicilio invalido`)
    }
  }

  // Agrega un nuevo registro a la tabla Domicilio, devuelve el id del nuevo registro
  async addDomicilio(queryRunner:any, domicilio:any, DomicilioDomLugar:string){
    
    const address:any = domicilio.address
    let {PaisId, ProvinciaId, LocalidadId, BarrioId} = domicilio.verAddress

    //Crea la Provincia en caso de no estar registrada
    if (!ProvinciaId && address.state) {
      const ProvinciaDescripcion:string = address.state

      const Pais = await queryRunner.query(`
        SELECT ISNULL(PaisProvinciaUltNro, 0) AS PaisProvinciaUltNro, PaisId
        FROM Pais
        WHERE PaisId IN (@0)
      `, [PaisId])
      const newProvinciaId:number = Pais[0].PaisProvinciaUltNro+1

      await queryRunner.query(`
        UPDATE Pais
        SET PaisProvinciaUltNro = @0
        WHERE PaisId IN (@1)

        INSERT INTO Provincia (
          ProvinciaId,
          PaisId,
          ProvinciaId,
          ProvinciaDescripcion,
          ProvinciaLocalidadUltNro ) 
        VALUES (@0, @1, @2, @3, 0)
      `, [newProvinciaId, PaisId, ProvinciaId, ProvinciaDescripcion])

      ProvinciaId = newProvinciaId
    }
    
    //Crea la localidad en caso de no estar registrada
    if (ProvinciaId && !LocalidadId && (address.state_district || address.city)) {
      const LocalidadDescripcion:string = address.state_district? address.state_district : address.city

      const Provincia = await queryRunner.query(`
        SELECT ISNULL(ProvinciaLocalidadUltNro, 0) AS ProvinciaLocalidadUltNro, ProvinciaId, PaisId
        FROM Provincia
        WHERE PaisId IN (@0) AND ProvinciaId IN (@1)
      `, [PaisId, ProvinciaId])
      const newLocalidadId:number = Provincia[0].ProvinciaLocalidadUltNro+1

      await queryRunner.query(`
        UPDATE Provincia
        SET ProvinciaLocalidadUltNro = @0
        WHERE PaisId IN (@1) AND ProvinciaId IN (@2)

        INSERT INTO Localidad (
          LocalidadId,
          PaisId,
          ProvinciaId,
          LocalidadDescripcion,
          LocalidadBarrioUltNro ) 
        VALUES (@0, @1, @2, @3, 0)
      `, [newLocalidadId, PaisId, ProvinciaId, LocalidadDescripcion])

      LocalidadId = newLocalidadId
    }

    await queryRunner.query(
      `INSERT INTO Domicilio (
          DomicilioDomLugar, DomicilioDomCalle, DomicilioDomNro, DomicilioCodigoPostal, 
          DomicilioPaisId, DomicilioProvinciaId, DomicilioLocalidadId, DomicilioBarrioId,
          DomicilioCompleto, DomicilioJson) 
      VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9)`, 
      [ DomicilioDomLugar, address.road, address.house_number,
      address.postcode, PaisId, ProvinciaId, LocalidadId,
      BarrioId, domicilio.display_name, JSON.stringify(address) ]
    )
    const resDomicilio = await queryRunner.query(`SELECT IDENT_CURRENT('Domicilio')`)

    return resDomicilio[0][''] // New DomicilioId
  }
}

