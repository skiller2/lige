import { PersonalController } from "./personal.controller";
import { RecibosController } from "./recibos.controller";
import { ImpuestosAfipController } from "./impuestos-afip.controller";

export const personalController = new PersonalController();
export const recibosController = new RecibosController();
export const impuestosAfipController = new ImpuestosAfipController();