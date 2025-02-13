import jwt from "jsonwebtoken";
import { BaseController } from "src/controller/baseController";
import { dataSource } from "src/data-source";
//import { TokenExpiredError } from "jsonwebtoken";
export class AuthMiddleware {
  catchError = (err: any, res: any) => {
    //console.log('error', err.message);

    //if (err instanceof TokenExpiredError) {
    //  return res.status(401).send({ message: "Unauthorized! Access Token was expired!" });
    //}

    return res.status(401).json({ msg: err.message });
  }

  verifyToken = (req: any, res: any, next: any) => {
    const parsetoken = (req.headers.token) ? req.headers.token.split(" ") : "";

    const token = (parsetoken[1]) ? parsetoken[1] : req.headers.token;

    if (!token) return res.status(403).json({ msg: "No token provided" });
    const jwtsecret = (process.env.JWT_SECRET) ? process.env.JWT_SECRET : ""
    jwt.verify(token, jwtsecret, (err: any, decoded: any) => {
      if (err) return this.catchError(err, res);
      req.decoded_token = decoded;
      req.persona_cuit = (decoded.description != undefined) ? decoded.description : "";
      //      req.PersonalId = (decoded.PersonalId != undefined) ? decoded.PersonalId : 0;
      res.locals.PersonalId = (decoded.PersonalId != undefined) ? decoded.PersonalId : 0;
      res.locals.persona_cuit = (decoded.description != undefined) ? decoded.description : "";
      res.locals.userName = decoded.userName
      if (typeof decoded.groups === "string")
        req.groups = [decoded.groups]
      else
        req.groups = decoded.groups
      return next();
    });
  };

  hasGroup = (group: string[]) => {
    return (req, res, next) => {
      if (res.locals?.skipMiddleware) return next()

      let inGroup = false
      if (req?.groups) {
        for (const rowgroup of req?.groups) {
          for (const grp of group) {
            if (rowgroup.toLowerCase().indexOf(grp.toLowerCase()) != -1)
              return next()
          }
        }
      }
      const stopTime = performance.now()
      return res.status(409).json({ msg: `Requiere ser miembro del grupo ${group.join()}`, data: [], stamp: new Date(), ms: res.locals.startTime - stopTime });

    }
  }

  hasAuthResp = (skipNextonPass: boolean) => {
    return async (req, res, next) => {
      const stmActual = new Date();
      const PersonalId = res.locals.PersonalId
      const PersonalId_auth = req.params.personalIdRel

      const anio = stmActual.getFullYear()
      const mes = stmActual.getMonth() + 1
      if (PersonalId == PersonalId_auth) {
        res.locals.skipMiddleware = skipNextonPass
        return next()
      }
      if (PersonalId < 1) {
        return next()
      }
      const queryRunner = dataSource.createQueryRunner()

      const grupos = await BaseController.getGruposActividad(queryRunner, res.locals.PersonalId, anio, mes)
      let listGrupos = []
      for (const row of grupos)
        listGrupos.push(row.GrupoActividadId)
      if (listGrupos.length > 0) {
        let resPers = await queryRunner.query(`
        SELECT gap.GrupoActividadPersonalPersonalId FROM GrupoActividadPersonal gap 
        WHERE gap.GrupoActividadPersonalPersonalId = @0  AND gap.GrupoActividadPersonalDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND
        ISNULL(gap.GrupoActividadPersonalHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1) AND gap.GrupoActividadId IN (${listGrupos.join(',')})
        UNION
        SELECT gap.GrupoActividadJerarquicoPersonalId FROM GrupoActividadJerarquico gap 
        WHERE gap.GrupoActividadJerarquicoPersonalId = @0  AND gap.GrupoActividadJerarquicoDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND
        ISNULL(gap.GrupoActividadJerarquicoHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1) AND gap.GrupoActividadId IN (${listGrupos.join(',')})
        AND gap.GrupoActividadJerarquicoComo = 'J'
        `,
          [PersonalId_auth, anio, mes])
        if (resPers.length > 0) {
          res.locals.skipMiddleware = skipNextonPass
          return next()
        }
      }
      return next()

    }
  }


}
