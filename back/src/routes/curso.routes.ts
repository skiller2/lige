import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { cursoController, estudioController } from "../controller/controller.module"

export const cursoRouter = Router()

cursoRouter.get('/search', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => { 
    cursoController.search(req, res, next)
  })

  cursoRouter.get('/searchId/:id', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => { 
    cursoController.searchId(req, res, next)
  })


cursoRouter.get("/cols", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => {
    cursoController.getCursosColumns(req, res, next);
});

cursoRouter.get("/colsHistory", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => {
  cursoController.getCursosColumnsHistory(req, res, next);
});

cursoRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => { 
  cursoController.list(req, res, next)
})

cursoRouter.post('/listHistory', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => { 
  cursoController.listHistory(req, res, next)
})

cursoRouter.get('/searchModalidadCurso', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => { 
  cursoController.searchModalidadCurso(req, res, next)
})

cursoRouter.get('/searchModalidadCursoId/:id', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => { 
  cursoController.searchModalidadCursoId(req, res, next)
})

cursoRouter.post('/setcurso', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal'])], (req, res, next) => { 
  cursoController.setCurso(req, res, next)
})

cursoRouter.delete("/", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal'])], (req, res, next) => {
  cursoController.deleteCurso(req, res, next);
});


  