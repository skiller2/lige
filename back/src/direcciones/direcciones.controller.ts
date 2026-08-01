import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Response } from "express";

export class DireccionesController extends BaseController {
    test(req: any, res: any, next: any) {
        throw new Error("Method not implemented.");
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

        const result: any = await response.json()

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

            await queryRunner.startTransaction();
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

                const domNormalizar = direccion.domNormalizar
                const DomicilioId = direccion.DomicilioId

                await DireccionesController.waitT(1500)
                const nominatimResult = await this.getDireccionNominatim(domNormalizar)


                if (nominatimResult.length != 1)
                    continue

                const nominatimItem = nominatimResult[0]
                console.log("Que tengo:")
                console.log(nominatimItem)
                break;

                await queryRunner.query(`
                                    UPDATE Domicilio SET DomicilioJson = @1,  DomicilioCompleto = @2
                                    WHERE DomicilioId =@0
                                `, [DomicilioId])
                registrosActualizados++
            }

            throw new ClientException(`Direcciones normalizadas ${registrosActualizados}`, { registrosActualizados }, 0)
            await queryRunner.commitTransaction();

            await this.eventoLogFin(
                queryRunner,
                EventoLogCodigo,
                'COM',
                {
                    res: `Procesado correctamente`,
                    'Registros Actualizados': registrosActualizados
                },
                usuario,
                ip
            );


            this.jsonRes({ registrosActualizados }, res, `Direcciones normalizadas ${registrosActualizados}`);

        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            await this.eventoLogFin(queryRunner,
                EventoLogCodigo,
                'ERR',
                { res: error },
                usuario,
                ip
            );
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }
}