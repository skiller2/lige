import { NextFunction, Request, Response } from "express"
import { BaseController, ClientException } from "../controller/baseController"
import { dataSource } from "../data-source"
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros"
import { mkdirSync, existsSync, readFileSync, unlinkSync, mkdir, createWriteStream, writeFile, writeFileSync } from "fs"
import xlsx from 'node-xlsx'
import { isNumberObject } from "util/types"
import fetch from "node-fetch"
import { tmpName } from "../server"

export class ReportesController extends BaseController {
  directory = process.env.PATH_INFORMES || "tmp"
  ssrsUser = process.env.SSRS_USER || ""
  ssrsPass = process.env.SSRS_PASS || ""
  ssrsURLAPI = "https://gestion.linceseguridad.com.ar/reports/api/v2.0"
  ssrsURLAccess = "https://gestion.linceseguridad.com.ar/ReportServer?"

  async filterReport(req: Request, res: Response, next: NextFunction){

    const titleReport = req.params.title
    let Usuario = res.locals.userName
    try {
      const user = (res.locals.userName)? res.locals.userName : Usuario
      if (!user)
        throw new ClientException(`Usuario no identificado`)

      const resp = await fetch(this.ssrsURLAPI + "/CatalogItems", { method: 'GET', headers: { 'Authorization': 'Basic ' + Buffer.from('pedrob'+ ":" + 'Pebe1536').toString('base64') } })
      if (resp.status != 200)
        throw new ClientException(`Error accediendo al sistema de reportes status ${resp.status}`)

      const data:any = await resp.json()
      const rep = data.value.find(x => x.Name.localeCompare(titleReport) === 0)
      if (!rep.Path)
        throw new ClientException(`Reporte ${titleReport} no encontrado`)


      const para = await fetch(this.ssrsURLAPI + `/Reports(${rep.Id})/ParameterDefinitions`, { method: 'GET', headers: { 'Authorization': 'Basic ' + Buffer.from('pedrob'+ ":" + 'Pebe1536').toString('base64') } })
      if (para.status != 200)
        throw new ClientException(`Error accediendo al sistema de reportes status ${para.status}`)

      const dataparam:any = await para.json()

      console.log(dataparam)
      return this.jsonRes(dataparam, res)
    } catch (error) {
      return next(error)
    }
  }

  async Report(req: Request, res: Response, next: NextFunction) {
      const queryRunner = dataSource.createQueryRunner()

      const {
        Usuario,
        Reporte,
        Formato,
        Filtros
      } = req.body

      try {
        const user = (res.locals.userName)? res.locals.userName : Usuario
        if (!user)
          throw new ClientException(`Usuario no identificado`)
  

        const resp = await fetch(this.ssrsURLAPI + "/CatalogItems", { method: 'GET', headers: { 'Authorization': 'Basic ' + Buffer.from('pedrob'+ ":" + 'Pebe1536').toString('base64') } })
        if (resp.status != 200)
          throw new ClientException(`Error accediendo al sistema de reportes status ${resp.status}`)
  
        const data:any = await resp.json()
        const rep = data.value.find(x => x.Name.localeCompare(Reporte) === 0)
        if (!rep.Path)
          throw new ClientException(`Reporte ${Reporte} no encontrado`)
  
  
        const para = await fetch(this.ssrsURLAPI + `/Reports(${rep.Id})/ParameterDefinitions`, { method: 'GET', headers: { 'Authorization': 'Basic ' + Buffer.from('pedrob'+ ":" + 'Pebe1536').toString('base64') } })
        if (para.status != 200)
          throw new ClientException(`Error accediendo al sistema de reportes status ${para.status}`)
  
        const dataparam:any = await para.json()
  
  
        const filtrosOk = {}
        for (const param of dataparam.value) {
          const filtro = Object.entries(Filtros).find(x => x[0].localeCompare(param.Name, 'es', { sensitivity: 'base' }) === 0)
          if (filtro)
            filtrosOk[param.Name] = filtro[1]
        }
  
        const report = await fetch(this.ssrsURLAccess + rep.Path + "&" + new URLSearchParams(filtrosOk) + "&rs:Format=" + Formato, { method: 'GET', headers: { 'Authorization': 'Basic ' + Buffer.from('pedrob'+ ":" + 'Pebe1536').toString('base64') } })
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
