import type { QueryRunner } from "typeorm";
import { getAccessToken } from "./auth.ts";
import type { ConfigPatagonia } from "./auth.ts";

/** Resultado de consultar una referencia de pago contra el Banco Patagonia. */
export interface EstadoLoteResponse {
  ReferenciaPago: string;
  status: number;
  ok: boolean;
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
  const response = await fetch(`${config.host}/batch/status`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      externalReferenceId: ReferenciaPago,
      pageId: String(pageId),
      size: String(size),
    }),
  });

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
    status: response.status,
    ok: response.ok,
    respuesta,
  };
};

export { consultarEstadoLote };
