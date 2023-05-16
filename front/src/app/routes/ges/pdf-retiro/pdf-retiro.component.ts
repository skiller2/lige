import { Component } from '@angular/core';
import { SharedModule } from '@shared';
import { FilesService } from 'src/app/services/files.service';
import { PdfviewerComponent } from 'src/app/shared/pdfviewer/pdfviewer.component';
import { UploadFileComponent } from 'src/app/shared/upload-file/upload-file.component';

@Component({
  selector: 'app-pdf-retiro',
  templateUrl: './pdf-retiro.component.html',
  standalone: true,
  imports: [SharedModule],
})
export class PdfRetiroComponent {
  constructor(private filesService: FilesService) {}

  processedBuffer = new Uint8Array();
  fileName!: string;

  async processFile(file: File) {
    this.fileName = file.name;
    const buffer = await this.filesService.getArrayBufferFromFile(file);
    this.processedBuffer = buffer;
  }
}
