import { AuthController } from "./auth.controller";
import { InfoController } from "./info.controller";
import { PersonalController } from "./personal.controller";
import { ClienteController } from "../controller/cliente.Controller";
import { InitController } from "./init.controller";
import { SucursalController } from "./sucursal.controller";
import { ObjetivoController } from "./objetivo.controller";
import { AsistenciaController } from "./asistencia.controller";
import { AdelantosController } from "../adelantos/adelantos.controller";
import { ImpuestosAfipController } from "../impuestos-afip/impuestos-afip.controller";
import { CategoriasController } from "../categorias-cambio/categorias-cambio.controller";
import { ObjetivosPendasisController } from "../objetivos-pendasis/objetivos-pendasis.controller";
import { MovimientosAutomaticosController } from "../liquidaciones/movimientos-automaticos/movimientos-automaticos.controller";
import { IngresoPorAsistenciaController } from "../liquidaciones/ingreso-por-asistencia/ingreso-por-asistencia.controller";
import { IngresoAsistenciaAdministrativosController } from "../liquidaciones/ingreso-asistencia-administrativos/ingreso-asistencia-administrativos.controller";
import { IngresoArticulo42Controller } from "../liquidaciones/ingreso-art42/ingreso-art42.controller";
import { IngresoCoordinadorCuentaController } from "../liquidaciones/ingreso-coordinador-cuenta/ingreso-coordinador-cuenta.controller";
import { DescuentoPorDeudaAnteriorController } from "../liquidaciones/descuento-deuda-anterior/descuento-deduda-anterior.controller";
import { DescuentosController } from "../liquidaciones/descuentos/descuentos.controller";
import { MovimientoAcreditacionEnCuentaController } from "../liquidaciones//movimiento-acreditacion-cuenta/movimiento-acreditacion-cuenta.controller";


export const infoController = new InfoController();
export const authController = new AuthController();
export const personalController = new PersonalController();
export const clienteController = new ClienteController();
export const initController = new InitController();
export const sucursalController = new SucursalController();
export const objetivoController = new ObjetivoController();
export const asistenciaController = new AsistenciaController();
export const adelantosController = new AdelantosController();
export const impuestosAfipController = new ImpuestosAfipController();
export const categoriasController = new CategoriasController();
export const objetivosPendasisController = new ObjetivosPendasisController();
export const movimientosAutomaticosController = new MovimientosAutomaticosController();
export const ingresoPorAsistenciaController = new IngresoPorAsistenciaController();
export const ingresoAsistenciaAdministrativosController = new IngresoAsistenciaAdministrativosController();
export const ingresoArticulo42Controller = new IngresoArticulo42Controller();
export const ingresoCoordinadorCuentaController = new IngresoCoordinadorCuentaController();
export const descuentoPorDeudaAnteriorController = new DescuentoPorDeudaAnteriorController();
export const descuentosController = new DescuentosController();
export const movimientoAcreditacionEnCuentaController = new MovimientoAcreditacionEnCuentaController();


