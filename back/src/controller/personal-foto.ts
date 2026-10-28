import * as path from "node:path";
import type { QueryRunner } from "typeorm";
import { ClientException } from "./base.controller.ts";
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

export async function validarRostroFoto(archivos: any[]) {
  for (const file of archivos ?? []) {
    if (!file?.tempfilename) continue
    let vector: Float32Array | null
    try {
      vector = await calcularVectorFacial(path.join(pathDocuments(), 'temp', file.tempfilename))
    } catch (error) {
      console.error(`[personal] No se pudo validar el rostro de la foto ${file.tempfilename}`, error)
      continue
    }
    if (!vector)
      throw new ClientException(`No se detectó un rostro en la foto. Cargue una foto donde se vea la cara de frente.`)
  }
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

  // Si falla el cálculo, el vector queda en NULL y lo toma el cálculo de vectores faciales.
  // Si la foto no tiene rostro se rechaza y se deshace la transacción
  let vector: Float32Array | null = null
  let sinRostro = false
  try {
    vector = await calcularVectorFacial(rutaDocumento(doc[0].DocumentoPath))
    sinRostro = !vector
  } catch (error) {
    console.error(`[personal] No se pudo calcular el vector facial de la foto (DocumentoId ${DocumentoId}, PersonalId ${PersonalId})`, error)
  }
  if (sinRostro)
    throw new ClientException(`No se detectó un rostro en la foto. Cargue una foto donde se vea la cara de frente.`)
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
