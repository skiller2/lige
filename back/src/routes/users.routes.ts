import { Router } from "express";
import { usuariosController } from "../controller/controller.module";
const router = Router();
const base = '';

//router.post(`${base}`, (req, res) => { usuariosController.createFunction(req,res)})
//router.put(`${base}/:id`, (req, res) => { usuariosController.putFunction(req, res) })
router.delete(`${base}/:id`, (req, res) => { usuariosController.deleteById(res, req.params.id)})
router.get(`${base}/:id`, (req, res) => { usuariosController.findById(res, req.params.id)})
router.get(`${base}/`, (req, res) => { usuariosController.find(res, req)})

export default router;


