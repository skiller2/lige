import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { BehaviorSubject, Observable, map } from 'rxjs';

@Component({
    selector: 'app-upload-file',
    templateUrl: './upload-file.component.html',
    styleUrls: ['./upload-file.component.less'],
    imports: [...SHARED_IMPORTS, CommonModule]
})
export class UploadFileComponent {
  @Input() accept: string = '*';
  @Output() fileOutput = new EventEmitter<File>();

  $currentFile = new BehaviorSubject<File>(new File([], ''));
  $isFile = new BehaviorSubject(false);

  fileChange($event: Event) {
    const file = ($event.target as HTMLInputElement).files?.item(0);
    if (file) {
      this.fileOutput.emit(file);
      this.$currentFile.next(file);
    }
  }
}
