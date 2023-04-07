import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CreateOptions, PDFDocument, PDFImage, PDFPage, PageSizes } from 'pdf-lib';
import { DownloadService } from 'src/app/services/download.service';
import { grayscale, rgb } from 'pdf-lib'
import { BehaviorSubject } from 'rxjs';

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

  constructor(private downloadService: DownloadService) { }

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

    const originPDF = await PDFDocument.load(bufferPDF)
    const originPDFPages = originPDF.getPages()
    if (originPDFPages.length == 0) return

    const newPdf = await PDFDocument.create()

    const embededPages = await newPdf.embedPages(originPDFPages)
    const image = await fetch('assets/pdf/signature.png').then(res => res.arrayBuffer())
    const embededImage = await newPdf.embedPng(image)
    const scaleImage = embededImage.scale(1/60)

    let currentPage: PDFPage;

    embededPages.forEach((embPage, index) => {
      if (index % 2 == 0) {
        currentPage = newPdf.addPage(PageSizes.A4)
      }
      const pageRatio = currentPage.getWidth() / currentPage.getHeight()

//      embPage.scale(1 / pageRatio)
      currentPage.drawPage(embPage, { x: (currentPage.getWidth() - embPage.width) / 2, y: currentPage.getHeight() / 2 * ((index+1) % 2) })
      currentPage.drawImage(embededImage, { x: 210, y: 80 + embPage.height * ((index) % 2), width:scaleImage.width, height:scaleImage.height })
    })

    const arrayBuffer = await newPdf.save()

    this.$isProcessing.next(false)
    this.$currentDownloadablePDF.next(arrayBuffer)
  }

  async download() {
    if (this.$currentDownloadablePDF.value) {


      this.downloadService.downloadBlob(this.$currentDownloadablePDF.value, this.namePDFDownload,  'pdf')
    }
  }



}
