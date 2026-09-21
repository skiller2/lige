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

/** Código del catálogo de tipo de pago. */
const getTipoPago = () => process.env.BAPA_TIPO_PAGO || "PAGO_MONOTRIBUTO";
/** Tipo de documento del beneficiario. */
const getTipoDocumento = () => process.env.BAPA_TIPO_DOCUMENTO || "CUIT";

/**
 * Arma el externalReferenceId con el patrón que pide el banco: {CUITEmpresa}-{YYYYMM}-{IDUnico}.
 * @throws {ClientException} si no está configurado el CUIT de la empresa
 */
const armarExternalReferenceId = (
  anio: number,
  mes: number,
  idUnico: number
): string => {
  const cuitEmpresa = process.env.BAPA_CUIT_EMPRESA;
  if (!cuitEmpresa)
    throw new ClientException(
      `Falta configurar BAPA_CUIT_EMPRESA en el archivo .env`
    );

  return `${cuitEmpresa}-${anio}${String(mes).padStart(2, "0")}-${idUnico}`;
};

/** Arma un item del lote a partir del CUIT de la persona (11 dígitos, sin guiones). */
const armarItem = (CUIT: string | number): ItemLote => ({
  documentType: getTipoDocumento(),
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
  const accountNumber = process.env.BAPA_ACCOUNT_NUMBER;
  if (!accountNumber)
    throw new ClientException(
      `Falta configurar BAPA_ACCOUNT_NUMBER en el archivo .env`
    );

  const accessToken = await getAccessToken(app, queryRunner);

  const request = {
    accountNumber,
    type: getTipoPago(),
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
