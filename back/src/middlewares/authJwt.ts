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

      if (req?.groups) {
        for (const rowgroup of req?.groups) {
          const myGrp: string = rowgroup.match(/CN=([^,]+)/)![1]
          for (const grp of group) {
            if (myGrp.toLowerCase() == grp.toLowerCase())
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

  hasAuthRespByDocId = (skipNextonPass: boolean) => {
    return async (req, res, next) => {
      const stmActual = new Date();
      const ResponsablePersonalId = res.locals.PersonalId
      const documentId = req.params.id;

      let Documento = await dataSource.query(`SELECT docgen.persona_id FROM lige.dbo.docgeneral docgen WHERE doc_id = @0`, [documentId]);

      if (Documento.length > 0) {
        var DocumentoPersonalId = Documento[0].persona_id;
      } else {
        return res.status(404).json({ msg: "Documento no encontrado" });
      }
      
      const anio = stmActual.getFullYear()
      const mes = stmActual.getMonth() + 1
      if (ResponsablePersonalId == DocumentoPersonalId) {
        res.locals.skipMiddleware = skipNextonPass
        return next()
      }
      if (ResponsablePersonalId < 1) {
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
          [DocumentoPersonalId, anio, mes])
        if (resPers.length > 0) {
          res.locals.skipMiddleware = skipNextonPass
          return next()
        }
      }
      return next()

    }
  }

  hasAuthDocumentoTipo = (skipNextonPass: boolean) => {
    return async (req, res, next) => {
      if (res.locals?.skipMiddleware) return next()

      const documentId = req.params.id;

      let document = await dataSource.query(`SELECT docgen.doc_id AS id , docgen.doctipo_id, docgen.persona_id, docgen.path, docgen.nombre_archivo AS name, doctip.json_permisos_act_dir
                    FROM lige.dbo.docgeneral docgen
                    LEFT JOIN lige.dbo.doctipo doctip ON doctip.doctipo_id=docgen.doctipo_id
                    WHERE doc_id = @0`, [documentId]);

      // Verificar permisos segun doctipo del documento
      if (document[0]["json_permisos_act_dir"] && document.length > 0) {
        const json = JSON.parse(document[0]["json_permisos_act_dir"]);

        const PermisoFullAccess = json.FullAccess;
        const PermisoReadOnly = json.ReadOnly;

        // Verificar si alguno de los arrays tiene elementos
        if (
          (Array.isArray(PermisoFullAccess) && PermisoFullAccess.length > 0) ||
          (Array.isArray(PermisoReadOnly) && PermisoReadOnly.length > 0)
        ) {
          let tienePermiso = false;

          // Verificar grupos de FullAccess
          for (const grupoPermitidoFullAccess of PermisoFullAccess) {
            if (await BaseController.hasGroup(req, grupoPermitidoFullAccess)) {
              res.locals.skipMiddleware = skipNextonPass
              tienePermiso = true
              return next()
            }
          }

          // Si no tiene permiso FullAccess, verificar ReadOnly
          if (!tienePermiso) {
            for (const grupoPermitidoReadOnly of PermisoReadOnly) {
              if (await BaseController.hasGroup(req, grupoPermitidoReadOnly)) {
                res.locals.skipMiddleware = skipNextonPass
                tienePermiso = true
                return next()
              }
            }
          }

          if (!tienePermiso) {
            return res.status(409).json({ msg: "No tiene permiso para acceder a este documento " });
          }

       
        }
      } else {
        return next()
      }


    }

  };


}
