import type { QueryRunner } from "typeorm";
import { randomInt } from "node:crypto";
import { ClientException } from "../../controller/base.controller.ts";
import { getAccessToken } from "./auth.ts";
import type { ConfigPatagonia } from "./auth.ts";

/** Cada elemento del lote: tipo y número de documento del beneficiario. */
export interface ItemLote {
  documentType: string;
  documentNumber: string;
}

export interface EnvioLoteResponse {
  /** Método y ruta completa que se llamó, para informarlos en los mensajes de error. */
  method: string;
  url: string;
  status: number;
  ok: boolean;
  /** Body tal cual se envió, para poder revisarlo desde la pantalla. */
  request: any;
  respuesta: any;
}

/**
 * Arma el externalReferenceId: {CUIT empresa}-{YYYYMM}-{5 dígitos aleatorios}.
 * El CUIT sale de CuitEmpresa en los parámetros del Banco Patagonia (MONOT).
 * @throws {ClientException} si falta el CuitEmpresa en los parámetros
 */
const armarExternalReferenceId = (
  config: ConfigPatagonia,
  anio: number,
  mes: number
): string => {
  const cuitEmpresa = String(config.CuitEmpresa ?? "").replace(/\D/g, "");
  if (!cuitEmpresa)
    throw new ClientException(
      `Falta el CuitEmpresa en los parámetros del Banco Patagonia (MONOT).`
    );
  const aleatorio = String(randomInt(0, 100000)).padStart(5, "0");

  return `${cuitEmpresa}-${anio}${String(mes).padStart(2, "0")}-${aleatorio}`;
};

/** Arma un item del lote a partir del CUIT de la persona (11 dígitos, sin guiones). */
const armarItem = (CUIT: string | number, tipoDocumento: string): ItemLote => ({
  documentType: tipoDocumento,
  documentNumber: String(CUIT).replace(/\D/g, ""),
});

/**
 * Envía el lote de pago de monotributos al Banco Patagonia (API 7 - POST /batch/submit).
 * Devuelve la respuesta cruda del servicio, sin interpretarla.
 * @throws {ClientException} si falta la cuenta de la empresa o si no se puede autenticar
 */
const enviarLote = async (
  app: any,
  queryRunner: QueryRunner,
  config: ConfigPatagonia,
  externalReferenceId: string,
  items: ItemLote[]
): Promise<EnvioLoteResponse> => {
  if (!config.accountNumber)
    throw new ClientException(
      `Falta el accountNumber en los parámetros del Banco Patagonia (MONOT).`
    );

  const accessToken = await getAccessToken(app, queryRunner);

  const request = {
    accountNumber: config.accountNumber,
    type: config.tipo_pago,
    externalReferenceId,
    items,
  };

  const method = "POST";
  const url = `${config.host}/batch/submit`;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
    });
  } catch (error: any) {
    // El banco no respondió (caída, DNS, timeout): se informa como status 0
    return {
      method, url, status: 0, ok: false, request,
      respuesta: { error: error?.message, causa: error?.cause?.message },
    };
  }

  // Se lee como texto y recién después se intenta parsear, para no perder el
  // cuerpo cuando el servicio contesta un error que no es JSON.
  const texto = await response.text();
  let respuesta: any;
  try {
    respuesta = texto ? JSON.parse(texto) : null;
  } catch (_e) {
    respuesta = texto;
  }

  return { method, url, status: response.status, ok: response.ok, request, respuesta };
};

export { enviarLote, armarExternalReferenceId, armarItem };
