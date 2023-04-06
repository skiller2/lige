import { Component } from '@angular/core';
import { FilesService } from 'src/app/services/files.service';
import { PdfviewerComponent } from 'src/app/shared/pdfviewer/pdfviewer.component';

@Component({
  selector: 'app-pdf-retiro',
  templateUrl: './pdf-retiro.component.html',
  styleUrls: ['./pdf-retiro.component.less']
})
export class PdfRetiroComponent {

  constructor(private filesService: FilesService){}

  processedBuffer = new Uint8Array()

  async processFile(file: File) {
    const buffer = await this.filesService.getArrayBufferFromFile(file)
    this.processedBuffer = buffer
  }

}
