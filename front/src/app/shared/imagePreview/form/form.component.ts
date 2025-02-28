import { Component, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FileImageService } from '../file-image.service';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-form',
    templateUrl: './form.component.html',
    styleUrls: ['./form.component.css'],
    imports: [...SHARED_IMPORTS, CommonModule]
})
export class FormComponent {
  constructor(private fileService: FileImageService) {}

  @Output() fileChangeEvent = new EventEmitter<Event>()


  $currentIsFile: Observable<boolean> = this.fileService.$currentFile.pipe(map( file => file.size > 0 ? true : false))
  $currentFileName: Observable<string> = this.fileService.$currentFile.pipe(map( file => file.name))
  $currentFileSize: Observable<number> = this.fileService.$currentFile.pipe(map( file => file.size))
  
  fileChange($event: Event) {
    this.fileChangeEvent.emit($event)
    const file = ($event.target as HTMLInputElement).files?.item(0)
    if (file && file.type.startsWith("image/")) this.fileService.updateFile(file); else console.log("Error: File is not an image.")

  }
}
