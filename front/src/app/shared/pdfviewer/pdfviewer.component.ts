import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { PDFDocument, PDFPage, PageSizes } from 'pdf-lib';
import { DownloadService } from 'src/app/services/download.service';
import { grayscale, rgb } from 'pdf-lib'
import { BehaviorSubject } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdfviewer',
  templateUrl: './pdfviewer.component.html',
  styleUrls: ['./pdfviewer.component.less']
})
export class PdfviewerComponent implements OnChanges {

  @Input() bufferPDF: Uint8Array = new Uint8Array()
  @Input() namePDF: string = 'file.pdf'
  namePDFDownload: string = ''
  $currentDownloadablePDF = new BehaviorSubject<Uint8Array>(new Uint8Array())
  $isProcessing = new BehaviorSubject(false)
  pdfDataUri: SafeResourceUrl
  constructor(private downloadService: DownloadService, public sanitizer: DomSanitizer) { this.pdfDataUri=this.sanitizer.bypassSecurityTrustResourceUrl("")  }

  ngOnChanges(changes: SimpleChanges): void {
    this.createPDF(this.bufferPDF)
    if (this.namePDF) {
      var ext = this.namePDF.substring(this.namePDF.lastIndexOf('.') + 1)
      var name = this.namePDF.substring(0, this.namePDF.lastIndexOf('.'))
      this.namePDFDownload = `${name}_FIRMADO.${ext}`
    }
  }

  async createPDF(bufferPDF: Uint8Array) {
    if (bufferPDF.length == 0) return
    this.$currentDownloadablePDF.next(new Uint8Array())  //Vacío el contenido actual
    this.$isProcessing.next(true)
    this.pdfDataUri = ''
    const originPDF = await PDFDocument.load(bufferPDF)
    const originPDFPages = originPDF.getPages()
    if (originPDFPages.length == 0) return

    const newPdf = await PDFDocument.create()

    const embededPages = await newPdf.embedPages(originPDFPages)
    const image = await fetch('assets/pdf/firma_recibo.png').then(res => res.arrayBuffer())
    const embededImage = await newPdf.embedPng(image)
    const scaleImage = embededImage.scale(1/20)

    let currentPage: PDFPage;
    embededPages.forEach((embPage, index) => {
      if (index % 2 == 0) {
        currentPage = newPdf.addPage(PageSizes.A4)
      }
      const pageRatio = currentPage.getWidth() / currentPage.getHeight()


      const embPageSize = embPage.scale(1)
//      currentPage.drawPage(embPage, { x: (currentPage.getWidth() - embPage.width) / 2, y: currentPage.getHeight() / 2 * ((index+1) % 2) })
      const posy = ((index) % 2 == 0) ?   0 +20 : currentPage.getHeight() / 2 * -1 +20
      
      currentPage.drawPage(embPage, { x: (currentPage.getWidth() - embPageSize.width) / 2, y: posy, width:embPageSize.width, height:embPageSize.height })

      currentPage.drawImage(embededImage, { x: 210, y: (((index) % 2 == 0) ? currentPage.getHeight() / 2: 0)  + 90, width: scaleImage.width, height: scaleImage.height })
      currentPage.drawText("Ayala Ramirez Arnaldo Ramón\n     Asociado Nro 1879\n",{
        x: 190,
        y: (((index) % 2 == 0) ? currentPage.getHeight()/2 : 0) + 70,
        size: 6,
        color: rgb(0, 0, 0),
        lineHeight: 6,
        //opacity: 0.75,
      })
    })

    const arrayBuffer = await newPdf.save()
     
//    this.pdfDataUri = this.sanitizer.bypassSecurityTrustResourceUrl(await newPdf.saveAsBase64({ dataUri: true }))

    this.$isProcessing.next(false)
    this.$currentDownloadablePDF.next(arrayBuffer)
  }

  async download() {
    if (this.$currentDownloadablePDF.value) {


      this.downloadService.downloadBlob(this.$currentDownloadablePDF.value, this.namePDFDownload,  'pdf')
    }
  }
}
