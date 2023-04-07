import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CreateOptions, PDFDocument, PDFImage, PDFPage } from 'pdf-lib';
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
  @Input() namePDF: string = 'file'

  $currentDownloadablePDF = new BehaviorSubject<Uint8Array>(new Uint8Array())
  $isProcessing = new BehaviorSubject(false)

  constructor(private downloadService: DownloadService) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.createPDF(this.bufferPDF)
  }

  async createPDF(bufferPDF: Uint8Array) {
    if (bufferPDF.length == 0) return
    this.$currentDownloadablePDF.next(new Uint8Array())
    this.$isProcessing.next(true)

    const originPDF = await PDFDocument.load(bufferPDF)
    const originPDFPages = originPDF.getPages()
    if (originPDFPages.length == 0) return

    const newPdf = await PDFDocument.create()

    const embededPages = await newPdf.embedPages(originPDFPages)
    const image = await fetch('assets/pdf/signature.png').then(res => res.arrayBuffer())
    const embededImage = await newPdf.embedPng(image)


    // Array(Math.ceil(embededPages.length / 2)).fill(0).forEach((_, index) => {
    //   const page = newPdf.addPage()
    //   page.setSize(595.28, 841.89)

    //   const pageRatio = page.getWidth() / page.getHeight()
    //   Array(2).fill(0).forEach((_, idx)  => {
    //     const embPage = embededPages[index + idx]
    //     embPage.scale(1/pageRatio)

    //     page.drawPage(embPage, {x: (page.getWidth() - embPage.width) / 2, y: page.getHeight() / -2 * (idx - 1)})
    //     page.drawImage(embededImage, {x: 210, y: 80 + embPage.height * (idx), width: 60, height: 60 *  embededImage.height / embededImage.width})
    //   });

    // })
    let currentPage: PDFPage;

    embededPages.forEach((embPage, index) => {
      if (index % 2 == 0) {
        currentPage = newPdf.addPage()
        currentPage.setSize(595.28, 841.89)
      }
      const pageRatio = currentPage.getWidth() / currentPage.getHeight()

      embPage.scale(1 / pageRatio)
      // console.log(index, currentPage.getHeight() / 2 * ((index) % 2))
      currentPage.drawPage(embPage, { x: (currentPage.getWidth() - embPage.width) / 2, y: currentPage.getHeight() / 2 * ((index+1) % 2) })
      currentPage.drawImage(embededImage, { x: 210, y: 80 + embPage.height * ((index+1) % 2), width: 60, height: 60 * embededImage.height / embededImage.width })
    })

    const arrayBuffer = await newPdf.save()

    this.$isProcessing.next(false)
    this.$currentDownloadablePDF.next(arrayBuffer)
  }

  // async createPDF(pdf?: PDFDocument) {
  //   const newPdf = await PDFDocument.create()

  //   const sampleBytes = await fetch('assets/pdf/sample.pdf').then(res => res.arrayBuffer())
  //   const samplePDF = await PDFDocument.load(sampleBytes)

  //   const samplePDFPages = samplePDF.getPages()

  //   const embededPages = await newPdf.embedPages(samplePDFPages)

  //   const page = newPdf.addPage()

  //   page.drawPage(embededPages[0], {
  //     x: 0,
  //     width: page.getWidth() / 2,
  //   })
  //   page.drawPage(embededPages[0], {
  //     x: page.getWidth() / 2,
  //     width: page.getWidth() / 2,
  //   })
  //   const arrayBuffer = await newPdf.save()
  //   this.$currentDownloadablePDF.next(arrayBuffer)
  // }

  async download() {
    if (this.$currentDownloadablePDF.value) {
      this.downloadService.downloadBlob(this.$currentDownloadablePDF.value, `${this.namePDF}_FIRMADO`, 'pdf')
    }
  }



}
