import type { QueryRunner } from "typeorm";
import { getAccessToken } from "./auth.ts";
import type { ConfigPatagonia } from "./auth.ts";

/** Resultado de consultar el registro de un beneficiario contra el Banco Patagonia. */
export interface EstadoBeneficiarioResponse {
  documentNumber: string;
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
 * Consulta el registro de un beneficiario para un período (API 9 - POST /batch/record/status).
 * Si la persona entró en varios lotes el servicio devuelve el exitoso, y si no hubo ninguno,
 * el último error registrado. Devuelve la respuesta cruda del servicio, sin interpretarla.
 * @throws {ClientException} si falta la configuración o si no se puede autenticar
 */
const consultarEstadoBeneficiario = async (
  app: any,
  queryRunner: QueryRunner,
  config: ConfigPatagonia,
  CUIT: string | number,
  anio: number,
  mes: number
): Promise<EstadoBeneficiarioResponse> => {
  // Se pide en cada llamada para que renueve el token si venció.
  const accessToken = await getAccessToken(app, queryRunner);

  // El servicio espera los tres campos como string, el mes en MM y el año en YYYY
  const request = {
    documentNumber: String(CUIT).replace(/\D/g, ""),
    paymentMonth: String(mes).padStart(2, "0"),
    paymentYear: String(anio),
  };

  const method = "POST";
  const url = `${config.host}/batch/record/status`;
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
      documentNumber: request.documentNumber, method, url, status: 0, ok: false, request,
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
    documentNumber: request.documentNumber,
    method,
    url,
    status: response.status,
    ok: response.ok,
    request,
    respuesta,
  };
};

/**
 * Saca el voucherBase64 de la respuesta: es el PDF completo y no se guarda en ResultadoPago
 * (va a Documento), ni se manda a la pantalla.
 */
const sinVoucher = (respuesta: any) => {
  if (!respuesta || typeof respuesta != "object") return respuesta;
  const { voucherBase64, ...resto } = respuesta;
  return resto;
};

export { consultarEstadoBeneficiario, sinVoucher };
