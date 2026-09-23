import type { QueryRunner } from "typeorm";
import { getAccessToken } from "./auth.ts";
import type { ConfigPatagonia } from "./auth.ts";

/** Resultado de consultar una referencia de pago contra el Banco Patagonia. */
export interface EstadoLoteResponse {
  ReferenciaPago: string;
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
 * Consulta el estado de procesamiento de un lote en el Banco Patagonia (API 8 - POST /batch/status).
 * Devuelve la respuesta cruda del servicio, sin interpretarla.
 * @throws {ClientException} si falta la configuración o si no se puede autenticar
 */
const consultarEstadoLote = async (
  app: any,
  queryRunner: QueryRunner,
  config: ConfigPatagonia,
  ReferenciaPago: string,
  pageId: number,
  size: number
): Promise<EstadoLoteResponse> => {
  // Se pide en cada llamada para que renueve el token si venció en medio del lote.
  const accessToken = await getAccessToken(app, queryRunner);

  // El servicio espera los tres campos como string; pageId y size son opcionales
  const request = {
    externalReferenceId: ReferenciaPago,
    pageId: String(pageId),
    size: String(size),
  };

  const method = "POST";
  const url = `${config.host}/batch/status`;
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
      ReferenciaPago, method, url, status: 0, ok: false, request,
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

  return {
    ReferenciaPago,
    method,
    url,
    status: response.status,
    ok: response.ok,
    request,
    respuesta,
  };
};

export { consultarEstadoLote };
