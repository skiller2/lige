import type { QueryRunner } from "typeorm";
import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Response } from "express";

export class DireccionesController extends BaseController {
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
                
                LEFT JOIN Pais pais on pais.PaisId=dom.DomicilioPaisId
                LEFT JOIN Provincia prov on prov.PaisId=pais.PaisId and prov.ProvinciaId=dom.DomicilioProvinciaId
                LEFT JOIN Localidad loc on loc.PaisId=pais.PaisId and loc.ProvinciaId=prov.ProvinciaId  and loc.LocalidadId=dom.DomicilioLocalidadId 
                LEFT JOIN Barrio bar on bar.PaisId=pais.PaisId and prov.ProvinciaId=bar.ProvinciaId and loc.LocalidadId=bar.LocalidadId and dom.DomicilioBarrioId=bar.BarrioId
                WHERE dom.DomicilioJson IS NULL`)



            for (const direccion of direcciones) {
                registrosProcesados++
                const domNormalizar = direccion.domNormalizar
                const DomicilioId = direccion.DomicilioId
                let nominatimResult: any = []
                await DireccionesController.waitT(1000)
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
}

