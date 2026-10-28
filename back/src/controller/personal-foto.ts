import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import * as path from "node:path";
import type { QueryRunner } from "typeorm";
import { BaseController, ClientException } from "./base.controller.ts";
import { calcularVectorFacial, columnasVectorFacial, insertDocumentoImagenFoto } from "../registro-asistencia/reconocimiento-facial.ts";

/*
 * Fotos del personal. El archivo y su ubicación están en Documento (DocumentoTipoCodigo = 'FOTO',
 * bajo PATH_DOCUMENTS). DocumentoImagenFoto guarda el vector facial y la marca de foto principal,
 * y se vincula con el documento por DocumentoImagenFoto.DocumentoId.
 * PersonalFotoId y DocumentoImagenFotoId identifican esos metadatos: la descarga usa el DocumentoId.
 */

export const DOCUMENTO_TIPO_FOTO = 'FOTO'

const pathDocuments = () => process.env.PATH_DOCUMENTS ? process.env.PATH_DOCUMENTS : '.'

/** Ruta física de un archivo de Documento (DocumentoPath es relativo a PATH_DOCUMENTS). */
export function rutaDocumento(DocumentoPath: string) {
  return path.join(pathDocuments(), DocumentoPath)
}

function extension(nombreArchivo: string) {
  const punto = nombreArchivo?.lastIndexOf('.') ?? -1
  return punto >= 0 ? nombreArchivo.slice(punto + 1).toLowerCase() : ''
}

/**
 * Registra los metadatos de una foto cargada o reemplazada en Documento: calcula el vector facial
 * con el archivo guardado en DocumentoPath. Si el documento todavía no tiene DocumentoImagenFoto, la
 * crea como foto principal de la persona; si ya tiene, recalcula el vector (con su fecha y versión).
 */
export async function registrarFotoDocumento(queryRunner: QueryRunner, PersonalId: number, DocumentoId: number) {
  const doc = await queryRunner.query(`SELECT DocumentoPath, DocumentoNombreArchivo FROM Documento WHERE DocumentoId = @0`, [DocumentoId])
  if (!doc.length)
    throw new ClientException(`No se encontró el documento de la foto (${DocumentoId})`)

  // Si falla o la foto no tiene rostro, el vector queda en NULL y lo toma el cálculo de vectores faciales
  let vector: Float32Array | null = null
  try {
    vector = await calcularVectorFacial(rutaDocumento(doc[0].DocumentoPath))
  } catch (error) {
    console.error(`[personal] No se pudo calcular el vector facial de la foto (DocumentoId ${DocumentoId}, PersonalId ${PersonalId})`, error)
  }
  const TipoArchivo = extension(doc[0].DocumentoNombreArchivo)

  const foto = await queryRunner.query(`SELECT DocumentoImagenFotoId FROM DocumentoImagenFoto WHERE DocumentoId = @0`, [DocumentoId])
  if (foto.length) {
    // El CONVERT es por el NULL: como parámetro va como nvarchar y no se convierte solo a VARBINARY
    const { VectorFacial, VectorFacialFecha, VectorFacialVersion } = columnasVectorFacial(vector)
    await queryRunner.query(`
      UPDATE DocumentoImagenFoto SET
        DocumentoImagenFotoBlobTipoArchivo = @1,
        VectorFacial = CONVERT(VARBINARY(MAX), @2),
        VectorFacialFecha = @3,
        VectorFacialVersion = @4
      WHERE DocumentoId = @0`,
      [DocumentoId, TipoArchivo, VectorFacial, VectorFacialFecha, VectorFacialVersion])
    return
  }

  // La foto nueva es la principal: las demás de la persona dejan de serlo
  await queryRunner.query(`UPDATE DocumentoImagenFoto SET IndFotoPrincipal = 0 WHERE PersonalId = @0`, [PersonalId])
  await insertDocumentoImagenFoto(queryRunner, PersonalId, TipoArchivo, vector, DocumentoId)
  const nueva = await queryRunner.query(`
    SELECT TOP 1 DocumentoImagenFotoId FROM DocumentoImagenFoto WHERE DocumentoId = @0 ORDER BY DocumentoImagenFotoId DESC`,
    [DocumentoId])
  await queryRunner.query(`UPDATE Personal SET PersonalFotoId = @0 WHERE PersonalId = @1`, [nueva[0].DocumentoImagenFotoId, PersonalId])
}

/**
 * Antes de borrar un documento tipo FOTO (o de cambiarle el tipo): borra sus metadatos de
 * DocumentoImagenFoto y deja coherente la foto principal de la persona.
 */
export async function eliminarFotoDocumento(queryRunner: QueryRunner, DocumentoId: number) {
  const fotos = await queryRunner.query(`SELECT DocumentoImagenFotoId, PersonalId FROM DocumentoImagenFoto WHERE DocumentoId = @0`, [DocumentoId])
  if (!fotos.length) return

  await queryRunner.query(`DELETE FROM DocumentoImagenFoto WHERE DocumentoId = @0`, [DocumentoId])
  for (const PersonalId of new Set<number>(fotos.map((foto: any) => foto.PersonalId)))
    await reasignarFotoPrincipal(queryRunner, PersonalId)
}

/**
 * Deja una sola foto principal y Personal.PersonalFotoId apuntando a ella: la principal que quede o,
 * si no queda ninguna marcada, la última cargada. Sin fotos, PersonalFotoId queda en NULL.
 */
export async function reasignarFotoPrincipal(queryRunner: QueryRunner, PersonalId: number) {
  const foto = await queryRunner.query(`
    SELECT TOP 1 DocumentoImagenFotoId FROM DocumentoImagenFoto
    WHERE PersonalId = @0
    ORDER BY ISNULL(IndFotoPrincipal, 0) DESC, DocumentoImagenFotoId DESC`,
    [PersonalId])
  const FotoId = foto[0]?.DocumentoImagenFotoId ?? null

  if (FotoId)
    await queryRunner.query(`
      UPDATE DocumentoImagenFoto SET IndFotoPrincipal = IIF(DocumentoImagenFotoId = @1, 1, 0) WHERE PersonalId = @0`,
      [PersonalId, FotoId])
  await queryRunner.query(`UPDATE Personal SET PersonalFotoId = @1 WHERE PersonalId = @0`, [PersonalId, FotoId])
}

/**
 * Fotos históricas: a cada DocumentoImagenFoto sin DocumentoId le crea (o reutiliza) su documento
 * tipo FOTO y completa la asociación. El archivo queda en PATH_DOCUMENTS/<año><DocumentoTipoPathOrigen>
 * con el nombre que tenía (p. ej. 2026/foto/29579-12334-FOTO.jpg); si todavía no está ahí, se copia
 * del directorio anterior (PATH_ARCHIVOS). Cada foto se graba sola: una que falla no corta el resto.
 */
export async function migrarFotosHistoricas(queryRunner: QueryRunner, usuario: string, ip: string) {
  const tipo = await queryRunner.query(`SELECT DocumentoTipoPathOrigen FROM DocumentoTipo WHERE DocumentoTipoCodigo = @0`, [DOCUMENTO_TIPO_FOTO])
  if (!tipo.length || !tipo[0].DocumentoTipoPathOrigen)
    throw new ClientException(`El tipo de documento ${DOCUMENTO_TIPO_FOTO} no existe o no tiene carpeta (DocumentoTipoPathOrigen)`)

  const fotos = await queryRunner.query(`
    SELECT foto.DocumentoImagenFotoId, foto.PersonalId, TRIM(foto.DocumentoImagenFotoBlobNombreArchivo) AS NombreArchivo,
      CONCAT(TRIM(dir.DocumentoImagenParametroDirectorioPathWeb), TRIM(foto.DocumentoImagenFotoBlobNombreArchivo)) AS RutaAnterior,
      cuit.PersonalCUITCUILCUIT
    FROM DocumentoImagenFoto foto
    JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroDirectorioId = foto.DocumentoImagenParametroDirectorioId AND dir.DocumentoImagenParametroId = foto.DocumentoImagenParametroId
    LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = foto.PersonalId AND cuit.PersonalCUITCUILId = (SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = foto.PersonalId)
    WHERE foto.DocumentoId IS NULL AND ISNULL(TRIM(foto.DocumentoImagenFotoBlobNombreArchivo), '') <> ''
  `)

  const pathArchivos = process.env.PATH_ARCHIVOS ? process.env.PATH_ARCHIVOS : '.'
  const fechaActual = new Date()
  const carpeta = `${fechaActual.getFullYear()}${tipo[0].DocumentoTipoPathOrigen}`
  let creados = 0, reutilizados = 0, sinArchivo = 0, conError = 0
  const errores: string[] = []

  for (const foto of fotos) {
    try {
      // Un documento FOTO de la persona con el mismo archivo (de una migración anterior cortada)
      const existente = await queryRunner.query(`
        SELECT TOP 1 DocumentoId FROM Documento
        WHERE PersonalId = @0 AND DocumentoTipoCodigo = @1 AND DocumentoNombreArchivo = @2
        ORDER BY DocumentoId DESC`,
        [foto.PersonalId, DOCUMENTO_TIPO_FOTO, foto.NombreArchivo])

      let DocumentoId = existente[0]?.DocumentoId
      if (DocumentoId) {
        reutilizados++
      } else {
        const DocumentoPath = `${carpeta}${foto.NombreArchivo}`
        const destino = rutaDocumento(DocumentoPath)
        if (!existsSync(destino)) {
          const origen = path.join(pathArchivos, foto.RutaAnterior)
          if (!existsSync(origen)) {
            sinArchivo++
            if (errores.length < 10) errores.push(`Sin archivo: ${origen} (PersonalId ${foto.PersonalId})`)
            continue
          }
          mkdirSync(path.dirname(destino), { recursive: true })
          copyFileSync(origen, destino)
        }

        DocumentoId = await BaseController.getProxNumero(queryRunner, 'Documento', usuario, ip)
        await queryRunner.query(`
          INSERT INTO Documento (
            DocumentoId, DocumentoTipoCodigo, PersonalId, DocumentoDenominadorDocumento, DocumentoNombreArchivo,
            DocumentoFecha, DocumentoPath, DocumentoDetalleDocumento, DocumentoIndividuoDescargaBot,
            DocumentoAudFechaIng, DocumentoAudUsuarioIng, DocumentoAudIpIng,
            DocumentoAudFechaMod, DocumentoAudUsuarioMod, DocumentoAudIpMod,
            DocumentoAnio, DocumentoMes
          ) VALUES (@0, @1, @2, @3, @4, @5, @6, '', 0, @5, @7, @8, @5, @7, @8, @9, @10)`,
          [DocumentoId, DOCUMENTO_TIPO_FOTO, foto.PersonalId, foto.PersonalCUITCUILCUIT ?? String(foto.PersonalId), foto.NombreArchivo,
            fechaActual, DocumentoPath, usuario, ip, fechaActual.getFullYear(), fechaActual.getMonth() + 1])
        creados++
      }

      await queryRunner.query(`UPDATE DocumentoImagenFoto SET DocumentoId = @0 WHERE DocumentoImagenFotoId = @1 AND DocumentoId IS NULL`,
        [DocumentoId, foto.DocumentoImagenFotoId])
    } catch (error) {
      conError++
      if (errores.length < 10) errores.push(`${error instanceof Error ? error.message : error} (PersonalId ${foto.PersonalId})`)
    }
  }

  return { pendientes: fotos.length, creados, reutilizados, sinArchivo, conError, errores }
}
