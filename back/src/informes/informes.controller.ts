import type { NextFunction, Request, Response } from "express"
import { BaseController, ClientException } from "../controller/basecontroller.ts"
import { dataSource } from "../data-source.ts"
import { mkdirSync, existsSync, readFileSync, unlinkSync, mkdir, createWriteStream, writeFile, writeFileSync } from "fs"
import fetch from "node-fetch"
//import { resolve } from "path"
import { tmpName } from "../server.ts"

export class InformesController extends BaseController {
  directory = process.env.PATH_INFORMES || "tmp"
  ssrsUser = process.env.SSRS_USER || ""
  ssrsPass = process.env.SSRS_PASS || ""
  ssrsURLAPI = "https://gestion.linceseguridad.com.ar/reports/api/v2.0"
  ssrsURLAccess = "https://gestion.linceseguridad.com.ar/ReportServer?"
  async Report(req: Request, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner()
    const {
      Usuario,
      Reporte,
      Formato,
      Filtros
    } = req.body




    try {
      const user = (res.locals.userName) ? res.locals.userName : Usuario
      if (!user)
        throw new ClientException(`Usuario no identificado`)

      switch (Reporte) {
        case 'Banelco':
          if (res.locals.userName && !await this.hasGroup(req, 'liquidaciones')) {
            if (!Filtros.Jerarquico) throw new ClientException(`Debe seleccionar el responsable`)
            if (Filtros.Jerarquico != res.locals.PersonalId) throw new ClientException(`No tiene permiso para ver los movimientos del responsable seleccionado`)
          }
          break;
        case 'Listado Asistencia Control Acceso':
          if (res.locals.userName && !await this.hasGroup(req, 'gPersonal') && !await this.hasGroup(req, 'gPersonalCon')) throw new ClientException(`No tiene permiso para descargar el informe. Debe pertenecer al grupo de gPersonal o gPersonalCon.`)
          if (!Filtros.Ano || !Filtros.Mes) throw new ClientException(`Debe especificar Año y Mes para el informe`)
          break;
        default:
          break;
      }

      const resp = await fetch(this.ssrsURLAPI + "/CatalogItems", { method: 'GET', headers: { 'Authorization': 'Basic ' + Buffer.from(this.ssrsUser + ":" + this.ssrsPass).toString('base64') } })
      if (resp.status != 200)
        throw new ClientException(`Error accediendo al sistema de reportes status ${resp.status}`)

      const data: any = await resp.json()
      const rep = data.value.find(x => x.Name.localeCompare(Reporte) === 0)
      if (!rep.Path)
        throw new ClientException(`Reporte ${Reporte} no encontrado`)


      const para = await fetch(this.ssrsURLAPI + `/Reports(${rep.Id})/ParameterDefinitions`, { method: 'GET', headers: { 'Authorization': 'Basic ' + Buffer.from(this.ssrsUser + ":" + this.ssrsPass).toString('base64') } })
      if (para.status != 200)
        throw new ClientException(`Error accediendo al sistema de reportes status ${para.status}`)

      const dataparam: any = await para.json()


      const filtrosOk = {}
      for (const param of dataparam.value) {
        const filtro = Object.entries(Filtros).find(x => x[0].localeCompare(param.Name, 'es', { sensitivity: 'base' }) === 0)
        if (filtro)
          filtrosOk[param.Name] = filtro[1]
      }

      const params = new URLSearchParams(filtrosOk);
      const report = await fetch(this.ssrsURLAccess + rep.Path + (params.toString() ? ("&" + params) : "") + "&rs:Format=" + Formato, { method: 'GET', headers: { 'Authorization': 'Basic ' + Buffer.from(this.ssrsUser + ":" + this.ssrsPass).toString('base64') } })

      if (report.status != 200)
        throw new ClientException(`Error accediendo al sistema de reportes status ${report.status}`)

      if (!existsSync(this.directory))
        mkdirSync(this.directory, { recursive: true });

      let extension = ""
      switch (Formato.toUpperCase()) {
        case "EXCEL":
          extension = "xls"
          break;
        case "PDF":
          extension = "pdf"
          break;

        default:
          break;
      }

      const buffer = await report.buffer();
      const tmpfilename = `${this.directory}/${tmpName(this.directory)}`;

      writeFileSync(tmpfilename, buffer);

      res.download(tmpfilename, `${Reporte}.${extension}`, (msg) => {
        unlinkSync(tmpfilename);
      });

    } catch (error) {
      return next(error)
    }
  }
}
