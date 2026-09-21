import type { QueryRunner } from "typeorm";
import { ClientException } from "../../controller/base.controller.ts";
import { getAccessToken } from "./auth.ts";
import type { ConfigPatagonia } from "./auth.ts";

/** Cada elemento del lote: tipo y número de documento del beneficiario. */
export interface ItemLote {
  documentType: string;
  documentNumber: string;
}

export interface EnvioLoteResponse {
  status: number;
  ok: boolean;
  /** Body tal cual se envió, para poder revisarlo desde la pantalla. */
  request: any;
  respuesta: any;
}

const PREFIJO_REFERENCIA = "CUITEmpresa";
const CUIT_EMPRESA = "30643445510";

/**
 * Arma el externalReferenceId: CUITEmpresa{CUIT}-{YYYYMM}-{IDUnico}.
 */
const armarExternalReferenceId = (
  config: ConfigPatagonia,
  anio: number,
  mes: number,
  idUnico: number
): string => {
  const cuitEmpresa = String(config.cuit_empresa || CUIT_EMPRESA).replace(/\D/g, "");
  const secuencia = String(idUnico).padStart(5, "0");

  return `${PREFIJO_REFERENCIA}${cuitEmpresa}-${anio}${String(mes).padStart(2, "0")}-${secuencia}`;
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

  const response = await fetch(`${config.host}/batch/submit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
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

  return { status: response.status, ok: response.ok, request, respuesta };
};

export { enviarLote, armarExternalReferenceId, armarItem };
