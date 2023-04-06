import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { DownloadService } from 'src/app/services/download.service';
import { grayscale, rgb } from 'pdf-lib'
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-pdfviewer',
  templateUrl: './pdfviewer.component.html',
  styleUrls: ['./pdfviewer.component.less']
})
export class PdfviewerComponent implements OnChanges{

  @Input() bufferPDF: Uint8Array = new Uint8Array()

  $currentDownloadablePDF = new BehaviorSubject<Uint8Array>(new Uint8Array())
  constructor(private downloadService: DownloadService) { }
  ngOnChanges(changes: SimpleChanges): void {
    this.createPDF(this.bufferPDF)
  }

  async createPDF(bufferPDF: ArrayBuffer) {
    const newPdf = await PDFDocument.create()

    const samplePDF = await PDFDocument.load(bufferPDF)

    const samplePDFPages = samplePDF.getPages()

    const embededPages = await newPdf.embedPages(samplePDFPages)

    const page = newPdf.addPage()

    page.drawPage(embededPages[0], {
      x: 0,
      width: page.getWidth() / 2,
    })
    page.drawPage(embededPages[1], {
      x: page.getWidth() / 2,
      width: page.getWidth() / 2,
    })
    const arrayBuffer = await newPdf.save()
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
    this.downloadService.downloadBlob(this.$currentDownloadablePDF.value, 'file.pdf', 'pdf')
  }



}
