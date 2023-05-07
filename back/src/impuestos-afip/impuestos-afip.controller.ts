import { Request, Response } from "express";
import { getDocument } from "pdfjs-dist/legacy/build/pdf";
import { BaseController } from "../controller/baseController";
import {
  arrayAsString,
  decodePDFRawStream,
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFPageLeaf,
  PDFRawStream,
  PDFRef,
} from "pdf-lib";
import fs from "fs";
import { TextItem } from "pdfjs-dist/types/src/display/api";

export class ImpuestosAfipController extends BaseController {
  async handlePDFUpload(req: Request, res: Response) {
    const file = req.file;
    try {
      if (!file) throw new Error("File not recieved/did not pass filter.");

      const loadingTask = getDocument(file.path);

      const document = await loadingTask.promise;

      // const metadata = await document.getMetadata();
      // console.log(metadata);

      const page = await document.getPage(1);
      const textContent = await page.getTextContent();

      const periodoRegex = /^PERIODO FISCAL ([0-9]{4})\/([0-9]{2})/;
      const periodoFind = textContent.items.find((item) =>
        periodoRegex.test(item.str)
      );
      const [_, periodoAño, periodoMes] = periodoFind.str.match(periodoRegex);
      console.log(periodoAño, periodoMes);
      // textContent.items.forEach((item, index) => {
      //   const str = item.str;
      //   const periodoArray = str.match(
      //     /^PERIODO FISCAL ([0-9]{4})\/([0-9]{2})/
      //   );
      //   console.log(str);
      //   console.log(periodoArray);
      //   const importeArray = str.match(/^$ ([0-9]{4}),([0-9]{2})/);
      //   // if (periodoArray.length == 3)
      //   // console.log("Periodo", periodoArray[1], periodoArray[2]);
      //   // if (str.startsWith("$")) console.log("Importe:", item, index);
      //   // if (str.startsWith("CC")) console.log("Medio de pago:", item, index);
      // });
>>>>>>> Stashed changes

      this.jsonRes([], res, "PDF Recieved!");
    } catch (err) {
      this.errRes(err, res, "Something failed!", 400);
    }
  }
  // async handlePDFUpload(req: any, res: Response) {
  //   try {
  //     if (!req.file) throw new Error("File not recieved/did not pass filter.");

  //     const file: Express.Multer.File = req.file
  //     const filename: string = file.originalname
  //     const path: string = file.path
  //     //Analizar el contenido del archivo y el formato de cuit del nombre para cargar los valores
  //     console.log('req', filename, file)

  //     const markedContentRegex = (mcid: number) =>
  //       new RegExp(`<<[^]*\\/MCID[\\0\\t\\n\\f\\r\\ ]*${mcid}[^]*>>[^]*BDC([^]*)EMC`);

  //     const extractMarkedContent = (mcid: number, contentStream: string) => {
  //       const regex = markedContentRegex(mcid);
  //       const res = contentStream.match(regex);
  //       return res?.[1];
  //     };

  //     const traverseStructTree = (root: PDFDict) => {
  //       const kidsRef = root.get(PDFName.of('K'));
  //       const structElementType = root.get(PDFName.of('S'));
  //       const paragraphType = PDFName.of('P');

  //       if (structElementType === paragraphType) {
  //         // TODO: What if this isn't a `PDFPageLeaf`?
  //         const page = root.lookup(PDFName.of('Pg')) as PDFPageLeaf;

  //         // TODO: What if this isn't a `PDFRawStream`?
  //         const contents = page.Contents() as PDFRawStream;

  //         // TODO: What if this isn't a `PDFNumber`?
  //         const markedContentIdentifer = kidsRef! as PDFNumber;
  //         const mcid = markedContentIdentifer.value();

  //         console.log(`------- Marked Content (id=${mcid}) --------`);
  //         const decodedBytes = decodePDFRawStream(contents).decode();
  //         const decodedString = arrayAsString(decodedBytes);
  //         const content = extractMarkedContent(mcid, decodedString);
  //         console.log(content);
  //         console.log(`-------- End (id=${mcid}) ---------`);
  //         console.log();
  //       }

  //       let node;
  //       if (!kidsRef || kidsRef instanceof PDFNumber) return;

  //       if (kidsRef instanceof PDFRef) {
  //         node = root.context.lookup(kidsRef, PDFDict);
  //         traverseStructTree(node);
  //       } else if (kidsRef instanceof PDFArray) {
  //         for (let idx = 0, len = kidsRef.size(); idx < len; idx++) {
  //           const nodeRef = kidsRef.get(idx);
  //           node = root.context.lookup(nodeRef);
  //           if (!(node instanceof PDFDict)) return;
  //           traverseStructTree(node);
  //         }
  //       }
  //     };

  //     const pdfDoc = await PDFDocument.load(fs.readFileSync(path));

  //     //console.log('pdfDoc',pdfDoc)

  //     const structTreeRoot = pdfDoc.catalog.lookupMaybe(
  //       PDFName.of('structTreeRoot'),
  //       //          PDFName.of('Catalog'),
  //       PDFDict,
  //     );
  //     console.log('structTreeRoot', structTreeRoot)
  //     traverseStructTree(structTreeRoot);

  //     this.jsonRes([], res, "PDF Recieved!");
  //   } catch (err) {
  //     this.errRes(err, res, "Something failed!", 400);
  //   }
  // }
}
