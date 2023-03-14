import { Router } from "express";
import { usuariosController } from "../controller/controller.module";
export const usersRouter = Router();
const base = '';

//router.post(`${base}`, (req, res) => { usuariosController.createFunction(req,res)})
//router.put(`${base}/:id`, (req, res) => { usuariosController.putFunction(req, res) })
usersRouter.delete(`${base}/:id`, (req, res) => { usuariosController.deleteById(res, req.params.id)})
usersRouter.get(`${base}/:id`, (req, res) => { usuariosController.findById(res, req.params.id)})
usersRouter.get(`${base}/`, (req, res) => { usuariosController.find(res, req)})



