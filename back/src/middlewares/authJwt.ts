import jwt from "jsonwebtoken";
import { table } from "node:console";
import path from "node:path";
import { BaseController, ClientException } from "src/controller/baseController";
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
      let grupos = []
      if (typeof decoded.groups === "string")
        grupos = [decoded.groups]
      else
        grupos = decoded.groups

      req.groups = grupos.map(r => r.match(/CN=([^,]+)/)![1])
      return next();
    });
  };

  hasGroup = (group: string[]) => {
    return (req, res, next) => {
      if (res.locals?.skipMiddleware) return next()

      for (const myGrp of req?.groups) {
        for (const grp of group) {
          if (myGrp.toLowerCase() === grp.toLowerCase()) return next()
        }
      }

      const stopTime = performance.now()
      return res.status(409).json({ msg: `Requiere ser miembro del grupo ${group.join()}`, data: [], stamp: new Date(), ms: res.locals.startTime - stopTime });

    }
  }

  filterSucursal = (req: any, res: any, next: any) => {
    res.locals.filterSucursal = []

    if (req?.groups.find((r: any) => r.localeCompare('MDQ') == 0)) {
      res.locals.filterSucursal.push(3)
    }
    if (req?.groups.find((r: string) => r.localeCompare('FORMOSA') == 0)) {
      res.locals.filterSucursal.push(2)
    }
    if (req?.groups.find((r: string) => r.localeCompare('CENTRAL') == 0)) {
      res.locals.filterSucursal.push(1)
    }

    //      res.locals.filterSucursal.push(2)
    console.log('filterSucursal', res.locals.filterSucursal, req?.groups);
    console.log(res.locals);

    return next()
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

  hasAuthGrupoActividad = () => {
    return async (req, res, next) => {
      const stmActual = new Date();
      const PersonalId = res.locals.PersonalId
      const GrupoActividadId = req.params.GrupoActividadId
      const anio = Number(req.body.anio);
      const mes = Number(req.body.mes);
      const opcionGrupoActividad = req.body.options.filtros

      console.log('hasAuthGrupoActividad', PersonalId, anio, mes, GrupoActividadId, opcionGrupoActividad, req.body, 'res.locals', res.locals);
      console.log(' req.params', req.params, 'req.query', req.query, 'req.body', req.body);

      if (PersonalId < 1) return res.status(403).json({ msg: `No se especifico PersonalId` })
      if (!anio || !mes) return res.status(403).json({ msg: `No se especifico anio o mes` })
      // if (!GrupoActividadId) return res.status(403).json({ msg: `No se especifico GrupoActividadId` })

      const queryRunner = dataSource.createQueryRunner()

      const grupos = await BaseController.getGruposActividad(queryRunner, res.locals.PersonalId, anio, mes)
      console.log('grupos', grupos);
      if (grupos.length > 0) {
        for (const row of grupos) {
          if (row.GrupoActividadId == GrupoActividadId) {
            res.locals.authGrupoActividad = true
            return next()
          }
        }


      }

      console.log('res.locals', res.locals);
      return res.status(403).json({ msg: `No tiene permiso para acceder al grupo de actividad ${GrupoActividadId}` })

    }

  }

  hasAuthByDocId = () => {
    return async (req, res, next) => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // console.log('params -----', req.params, 'body -----', req.body, 'query -----', req.query);


      try {

        const stmActual = new Date();
        const ResponsablePersonalId = res.locals.PersonalId;
        const tableForSearch = req.params.tableForSearch || req.query[1] || req.body.archivo?.[0]?.tableForSearch || req.body.files?.[0]?.tableForSearch;

        // predeterminadamente iguala a req.params.id, pero si se le pasa un string, lo toma como variable de req
        const documentId = req.params.id || req.body.doc_id || req.query[0] || req.body.DocumentoId;
        const documentType = req.body.doctipo_id || req.body.files?.[0]?.doctipo_id || req.body.DocumentoTipoCodigo//|| req.params.doctipo_id || req.query.doctipo_id;

        const path = req.route.path

        // console.log('tableforsearch', tableForSearch);
        // console.log('query --------- ', req.query);
        // console.log('documentType', documentType);
        // console.log('req -------------------- ', req);
        // console.log('req.url -------------------- ', req.url);
        // console.log('req.params -------------------- ', req.params);
        // console.log('req.body -------------------- ', req.body);
        // console.log('res -------------------- ', res);
        // console.log('res.locals -------------------- ', res.locals);
        // console.log('req.royte.path', req.route.path);

        if (!documentId && !documentType && !tableForSearch) return res.status(403).json({ msg: "No se ha proporcionado un documento o tipo de documento para verificar permisos." })
        if (!tableForSearch) return res.status(403).json({ msg: "No se ha proporcionado tableForSearch" })
        let Documento = null;
        console.log('documentId', documentId, 'documentType', documentType, 'tableForSearch', tableForSearch, 'path', path);
        switch (tableForSearch) {
          case 'docgeneral':
            if (documentId) {
              // Verificar existencia del documento

              Documento = await queryRunner.query(
                ` SELECT docgen.doc_id, docgen.persona_id ,doctip.json_permisos_act_dir, doctip.doctipo_id
                FROM lige.dbo.docgeneral docgen
                LEFT JOIN lige.dbo.doctipo doctip ON doctip.doctipo_id = docgen.doctipo_id
                WHERE docgen.doc_id = @0`,
                [documentId]
              );


              const doc = Documento[0];
              const DocumentoPersonalId = doc.persona_id;

              // Si el documento no tiene persona_id ni json_permisos_act_dir, se asume que es un documento general, sin restriccion de permisos y se permite el acceso

              if (Documento.length === 0) return next();
              if (path.includes('downloadFile') && ResponsablePersonalId == DocumentoPersonalId) return next();

              const documentoTipoIdOld = doc.doctipo_id
              const documentoTipoIdNew = req.body.doctipo_id
              // cuando se cambia el tipo de documento, se verifica si el nuevo tipo tiene permisos
              if (documentoTipoIdOld !== documentoTipoIdNew && documentoTipoIdNew && documentoTipoIdOld) {
                const permisosADDocumentoTipo = await queryRunner.query(
                  ` SELECT json_permisos_act_dir
                FROM lige.dbo.doctipo
                WHERE doctipo_id = @0`,
                  [documentoTipoIdNew]
                );
                // Si el tipo de documento tiene permisos, se valida
                if (permisosADDocumentoTipo[0].json_permisos_act_dir) return this.validateJsonPermisosActDir(permisosADDocumentoTipo[0].json_permisos_act_dir)(req, res, next);
              }

              if (!doc.persona_id && !doc.json_permisos_act_dir || !doc.json_permisos_act_dir) return next();

              // validacion cuando caso de ser un supervisor de la persona y quiera descargar un documento de la persona
              if (doc.persona_id && doc.doctipo_id === 'REC' && req.route.path.includes('downloadFile')) {
                const anio = stmActual.getFullYear();
                const mes = stmActual.getMonth() + 1;

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
                  if (resPers.length > 0) return next();
                }
              }

              // Si el documento tiene json_permisos_act_dir, se valida
              return this.validateJsonPermisosActDir(doc.json_permisos_act_dir)(req, res, next);
            }

            if (documentType) {
              // Si no se pasa el id del documento, pero si el tipo de documento, se verifica los permisos del tipo de documento
              const DocumentoTipo = await queryRunner.query(
                ` SELECT json_permisos_act_dir
              FROM lige.dbo.doctipo
              WHERE doctipo_id = @0`,
                [documentType]
              );

              // Si el tipo de documento tiene permisos, se valida
              if (!DocumentoTipo[0].json_permisos_act_dir) return next();
              return this.validateJsonPermisosActDir(DocumentoTipo[0].json_permisos_act_dir)(req, res, next);
            }

            console.log('no tiene documento ni tipo de documento');
            return res.status(403).json({ msg: `No tiene permiso para manipular al documento.` });

          case 'Documento':
            if (documentId) {
              // Verificar existencia del documento

              Documento = await queryRunner.query(
                ` SELECT doc.DocumentoId, doc.PersonalId ,doctip.DocumentoTipoJsonPermisosActDir, doctip.DocumentoTipoCodigo
                FROM Documento doc
                LEFT JOIN DocumentoTipo doctip ON doctip.DocumentoTipoCodigo = doc.DocumentoTipoCodigo
                WHERE doc.DocumentoId = @0`,
                [documentId]
              );


              const doc = Documento[0];
              const DocumentoPersonalId = doc.persona_id;

              // Si el documento no tiene persona_id ni DocumentoTipoJsonPermisosActDir, se asume que es un documento general, sin restriccion de permisos y se permite el acceso

              if (Documento.length === 0) return next();
              if (path.includes('downloadFile') && ResponsablePersonalId == DocumentoPersonalId) return next();

              const documentoTipoIdOld = doc.doctipo_id
              const documentoTipoIdNew = req.body.doctipo_id
              // cuando se cambia el tipo de documento, se verifica si el nuevo tipo tiene permisos
              if (documentoTipoIdOld !== documentoTipoIdNew && documentoTipoIdNew && documentoTipoIdOld) {
                const permisosADDocumentoTipo = await queryRunner.query(
                  ` SELECT DocumentoTipoJsonPermisosActDir
                FROM DocumentoTipo
                WHERE DocumentoTipoCodigo = @0`,
                  [documentoTipoIdNew]
                );
                // Si el tipo de documento tiene permisos, se valida
                if (permisosADDocumentoTipo[0].DocumentoTipoJsonPermisosActDir) return this.validateJsonPermisosActDir(permisosADDocumentoTipo[0].DocumentoTipoJsonPermisosActDir)(req, res, next);
              }

              if (!doc.persona_id && !doc.DocumentoTipoJsonPermisosActDir || !doc.DocumentoTipoJsonPermisosActDir) return next();

              // validacion cuando caso de ser un supervisor de la persona y quiera descargar un documento de la persona
              if (doc.persona_id && doc.doctipo_id === 'REC' && req.route.path.includes('downloadFile')) {
                const anio = stmActual.getFullYear();
                const mes = stmActual.getMonth() + 1;

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
                  if (resPers.length > 0) return next();
                }
              }

              // Si el documento tiene DocumentoTipoJsonPermisosActDir, se valida
              return this.validateJsonPermisosActDir(doc.DocumentoTipoJsonPermisosActDir)(req, res, next);
            }

            if (documentType) {
              // Si no se pasa el id del documento, pero si el tipo de documento, se verifica los permisos del tipo de documento
              const DocumentoTipo = await queryRunner.query(
                ` SELECT DocumentoTipoJsonPermisosActDir
              FROM DocumentoTipo
              WHERE DocumentoTipoCodigo = @0`,
                [documentType]
              );

              // Si el tipo de documento tiene permisos, se valida
              if (!DocumentoTipo[0].DocumentoTipoJsonPermisosActDir) return next();
              return this.validateJsonPermisosActDir(DocumentoTipo[0].DocumentoTipoJsonPermisosActDir)(req, res, next);
            }

            return res.status(403).json({ msg: `No tiene permiso para manipular al documento.` });

          default:
            return next();

        }


      } catch (error) {
        console.error("Error en hasAuthByDocId:", error);
        await queryRunner.rollbackTransaction();
        return res.status(500).json({ msg: "Error al verificar autorización", error: error.message });
      } finally {
        await queryRunner.release();
      }
    };
  }

  validateJsonPermisosActDir = (data: any) => {
    return async (req, res, next) => {

      let parsed: { FullAccess?: string[]; ReadOnly?: string[] };
      try {
        parsed = JSON.parse(data);
      } catch (e) {
        // Si el JSON está mal formado, devuelvo 403
        return res.status(403).json({ msg: "Permisos del tipo de documento mal formados" });
      }

      const PermisoFullAccess = Array.isArray(parsed.FullAccess) ? parsed.FullAccess : [];
      const PermisoReadOnly = Array.isArray(parsed.ReadOnly) ? parsed.ReadOnly : [];

      const gruposRequeridos = [...PermisoFullAccess, ...PermisoReadOnly];

      if (gruposRequeridos.length === 0) return next();

      const path = req.route.path;

      if (path.includes('downloadFile') && PermisoReadOnly.length === 0) {
        // no tiene detallado permisos de lectura, por lo que se asume que tiene acceso total
        return next();
      }
      if (path.includes('downloadFile')) {
        return this.hasGroup(gruposRequeridos)(req, res, next);
      }
      const writePaths = ["/add", "/update", "/delete", "/setestudio"];
      if (writePaths.includes(path)) {
        return this.hasGroup(PermisoFullAccess)(req, res, next);
      }
    }
  }
}
