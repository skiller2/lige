import { Component, EventEmitter, Output } from '@angular/core';
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

  @Output() eventEmitter = new EventEmitter<Event>()


  $currentIsFile: Observable<boolean> = this.fileService.$currentFile.pipe(map( file => file.size > 0 ? true : false))
  $currentFileName: Observable<string> = this.fileService.$currentFile.pipe(map( file => file.name))
  $currentFileSize: Observable<number> = this.fileService.$currentFile.pipe(map( file => file.size))
  
  fileChange($event: Event) {
    this.eventEmitter.emit($event)
    const file = ($event.target as HTMLInputElement).files?.item(0)
    if (file && file.type.startsWith("image/")) this.fileService.updateFile(file); else console.log("Error: File is not an image.")

  }
}
