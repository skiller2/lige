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
      try {
        const stmActual = new Date();
        const ResponsablePersonalId = res.locals.PersonalId;
        const documentId = req.params.id;

        // Verificar existencia del documento
        let Documento = await dataSource.query(
          `SELECT doc_id,persona_id FROM lige.dbo.docgeneral WHERE doc_id = @0`,
          [documentId]
        );

        if (Documento.length === 0) return res.status(404).json({ msg: "Documento no encontrado" });

        // Si el documento no tiene persona_id, se asume que es un documento general y se permite el acceso
        if (Documento[0].doc_id && !Documento[0].persona_id) {
          res.locals.skipMiddleware = skipNextonPass;
          return next();
        }

        const DocumentoPersonalId = Documento[0].persona_id;
        const anio = stmActual.getFullYear();
        const mes = stmActual.getMonth() + 1;

        // Es el dueño del documento
        if (ResponsablePersonalId == DocumentoPersonalId) {
          res.locals.skipMiddleware = skipNextonPass;
          return next();
        }

        if (ResponsablePersonalId < 1) {
          return next();
        }

        // Verificar permisos a través de grupos de actividad
        const queryRunner = dataSource.createQueryRunner();

        try {
          const grupos = await BaseController.getGruposActividad(queryRunner, res.locals.PersonalId, anio, mes);
          const listGrupos = grupos.map(row => row.GrupoActividadId);

          if (listGrupos.length > 0) {
            const resPers = await queryRunner.query(`
            SELECT gap.GrupoActividadPersonalPersonalId FROM GrupoActividadPersonal gap 
            WHERE gap.GrupoActividadPersonalPersonalId = @0  
            AND gap.GrupoActividadPersonalDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) 
            AND ISNULL(gap.GrupoActividadPersonalHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1) 
            AND gap.GrupoActividadId IN (${listGrupos.map((_, i) => `@${i + 3}`).join(',')})
            UNION
            SELECT gap.GrupoActividadJerarquicoPersonalId FROM GrupoActividadJerarquico gap 
            WHERE gap.GrupoActividadJerarquicoPersonalId = @0  
            AND gap.GrupoActividadJerarquicoDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) 
            AND ISNULL(gap.GrupoActividadJerarquicoHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1) 
            AND gap.GrupoActividadId IN (${listGrupos.map((_, i) => `@${i + 3}`).join(',')})
            AND gap.GrupoActividadJerarquicoComo = 'J'
          `, [DocumentoPersonalId, anio, mes, ...listGrupos]);

            if (resPers.length > 0) {
              res.locals.skipMiddleware = skipNextonPass;
              return next();
            }
          }

          // Si no cumple ninguna condición de autorización
          // return res.status(403).json({ msg: "No tiene autorización para ver o descargar este documento" });
          return next()

        } finally {
          await queryRunner.release();
        }
      } catch (error) {
        return res.status(500).json({ msg: "Error al verificar autorización", error: error.message });
      }
    };
  }

  hasAuthDocumentoTipo = (skipNextonPass: boolean) => {
    return async (req: any, res: any, next: any) => {
      // 1) Si ya se indicó skipMiddleware, salgo inmediatamente
      if (res.locals?.skipMiddleware) return next();

      const documentId = req.params.id;

      // 2) Obtener fila de docgeneral + doctipo (para JSON de permisos)
      const document = await dataSource.query(
        `
      SELECT docgen.doctipo_id, doctip.json_permisos_act_dir
      FROM lige.dbo.docgeneral docgen
      LEFT JOIN lige.dbo.doctipo doctip ON doctip.doctipo_id = docgen.doctipo_id
      WHERE docgen.doc_id = @0
      `,
        [documentId]
      );

      // 3) Si no existe ninguna fila, devuelvo 404
      if (document.length === 0) return res.status(404).json({ msg: "Documento no encontrado" });

      const documento = document[0];
      const jsonPermisos = documento["json_permisos_act_dir"];

      // 4) Si no hay JSON de permisos, dejo pasar
      if (!jsonPermisos) return next();

      let parsed: { FullAccess?: string[]; ReadOnly?: string[] };
      try {
        parsed = JSON.parse(jsonPermisos);
      } catch (e) {
        // Si el JSON está mal formado, devuelvo 403
        return res.status(403).json({ msg: "Permisos de documento mal formados" });
      }

      const PermisoFullAccess = Array.isArray(parsed.FullAccess) ? parsed.FullAccess : [];
      const PermisoReadOnly = Array.isArray(parsed.ReadOnly) ? parsed.ReadOnly : [];

      // 5) Si ambos arreglos vienen vacíos, asumo que ningún grupo tiene permiso
      if (PermisoFullAccess.length === 0 && PermisoReadOnly.length === 0) {
        return res.status(403).json({ msg: `No tiene permiso para acceder a este documento. Este documento requiere pertenecer a alguno de los siguientes grupos: ninguno definido.` });
      }

      // 6) Iterar sobre FullAccess primero
      for (const grupoPermitido of PermisoFullAccess) {
        const tiene = await BaseController.hasGroup(req, grupoPermitido);
        if (tiene) {
          // marco skipMiddleware y dejo pasar
          res.locals.skipMiddleware = skipNextonPass;
          return next();
        }
      }

      // 7) Iterar sobre ReadOnly si no hubo FullAccess
      for (const grupoPermitido of PermisoReadOnly) {
        const tiene = await BaseController.hasGroup(req, grupoPermitido);
        if (tiene) {
          // marco skipMiddleware y dejo pasar
          res.locals.skipMiddleware = skipNextonPass;
          return next();
        }
      }

      // 8) Si no pertenece a ninguno de los grupos, devuelvo 403 indicando los grupos requeridos
      const gruposRequeridos = [...PermisoFullAccess, ...PermisoReadOnly];
      return res.status(403).json({msg: `No tiene permiso para acceder al documento. Debe contar con los siguientes permisos: ${gruposRequeridos.join(", ")}`});
    };
  };



}
