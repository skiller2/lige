import type { QueryRunner } from "typeorm";
import { ClientException } from "../../controller/base.controller.ts";

/** Datos de conexión al Banco Patagonia, guardados en ParametroGeneral con código MONOT. */
export interface ConfigPatagonia {
  host: string;
  cliend_id: string;
  client_secret: string;
  /** Cuenta de la empresa de donde se debitan los fondos. Solo la usa el envío del lote. */
  accountNumber: string;
  /** CUIT de la empresa, para armar el externalReferenceId. Solo lo usa el envío del lote. */
  cuit_empresa: string;
  /** Código del catálogo de tipo de pago. */
  tipo_pago: string;
  /** Tipo de documento del beneficiario. */
  tipo_documento: string;
}

/** Token cacheado en req.app.locals.BAPA_TOKEN_API. */
export interface TokenPatagonia {
  access_token: string;
  token_type: string;
  expira: number;
}

const PARAMETRO_GENERAL_CODIGO = "MONOT";
/** Margen en segundos que se le descuenta al expires_in, para no usar un token al filo del vencimiento. */
const MARGEN_VENCIMIENTO_SEG = 60;

/**
 * Lee de ParametroGeneral los datos de conexión al Banco Patagonia.
 * @throws {ClientException} si no está el parámetro o si le falta algún dato
 */
const getConfigPatagonia = async (queryRunner: QueryRunner): Promise<ConfigPatagonia> => {
  const parametroGeneral = await queryRunner.query(
    `SELECT Parametros FROM ParametroGeneral WHERE ParametroGeneralCodigo = @0`,
    [PARAMETRO_GENERAL_CODIGO]
  );

  if (!parametroGeneral.length)
    throw new ClientException(
      `No se encontró el parámetro general ${PARAMETRO_GENERAL_CODIGO} con los datos de conexión al Banco Patagonia.`
    );

  let config: ConfigPatagonia;
  try {
    config = JSON.parse(parametroGeneral[0].Parametros);
  } catch (_e) {
    throw new ClientException(
      `Los parámetros del Banco Patagonia (${PARAMETRO_GENERAL_CODIGO}) no tienen un formato JSON válido.`
    );
  }

  // El documento del banco nombra al campo "cliend_id"; se acepta también la forma correcta.
  const cliend_id = config?.cliend_id ?? (config as any)?.client_id;

  // Solo se validan acá los datos de autenticación: accountNumber y cuit_empresa los usa
  // únicamente el envío del lote, y la consulta de estado tiene que andar sin ellos.
  if (!config?.host)
    throw new ClientException(
      `Falta el host en los parámetros del Banco Patagonia (${PARAMETRO_GENERAL_CODIGO}).`
    );
  if (!cliend_id)
    throw new ClientException(
      `Falta el cliend_id en los parámetros del Banco Patagonia (${PARAMETRO_GENERAL_CODIGO}).`
    );
  if (!config?.client_secret)
    throw new ClientException(
      `Falta el client_secret en los parámetros del Banco Patagonia (${PARAMETRO_GENERAL_CODIGO}).`
    );

  return {
    host: config.host.replace(/\/$/, ""),
    cliend_id,
    client_secret: config.client_secret,
    accountNumber: config.accountNumber,
    cuit_empresa: config.cuit_empresa,
    // Códigos del catálogo: si no están en el parámetro se usan los del documento.
    tipo_pago: config.tipo_pago || "PAGO_MONOTRIBUTO",
    tipo_documento: config.tipo_documento || "CUIT",
  };
};

/**
 * Devuelve un access_token vigente del Banco Patagonia (API 6 - OAuth 2.0 Client Credentials).
 * El token queda cacheado en app.locals.BAPA_TOKEN_API y solo se vuelve a pedir cuando venció.
 * @throws {ClientException} si el banco rechaza las credenciales
 */
const getAccessToken = async (app: any, queryRunner: QueryRunner): Promise<string> => {
  const cacheado: TokenPatagonia = app?.locals?.BAPA_TOKEN_API;

  if (cacheado?.access_token && cacheado.expira > Date.now())
    return cacheado.access_token;

  const config = await getConfigPatagonia(queryRunner);

  const credenciales = Buffer.from(
    `${config.cliend_id}:${config.client_secret}`
  ).toString("base64");

  const response = await fetch(`${config.host}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credenciales}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
  });

  const texto = await response.text();
  let respuesta: any;
  try {
    respuesta = texto ? JSON.parse(texto) : null;
  } catch (_e) {
    respuesta = texto;
  }

  if (!response.ok || !respuesta?.access_token)
    throw new ClientException(
      `No se pudo obtener el token del Banco Patagonia (HTTP ${response.status}).`,
      respuesta
    );

  const expiresIn = Number(respuesta.expires_in) || 0;
  const token: TokenPatagonia = {
    access_token: respuesta.access_token,
    token_type: respuesta.token_type || "Bearer",
    expira: Date.now() + Math.max(expiresIn - MARGEN_VENCIMIENTO_SEG, 0) * 1000,
  };

  if (app?.locals) app.locals.BAPA_TOKEN_API = token;

  return token.access_token;
};

export { getConfigPatagonia, getAccessToken };
