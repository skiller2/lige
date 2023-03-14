import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FileImageService } from '../file-image.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent {
  constructor(private fileService: FileImageService) {}

  $currentFileName: Observable<string | undefined> = this.fileService.$currentFile.pipe(map( file => file?.name))
  $currentFileSize: Observable<number | undefined> = this.fileService.$currentFile.pipe(map( file => Math.round((file?.size)!/1024)))
  
  fileChange($event: Event) {
    const file = ($event.target as HTMLInputElement).files?.item(0)
    if (file && file.type.startsWith("image/")) this.fileService.updateFile(file); else console.log("Error: File is not an image.")

  }
}
