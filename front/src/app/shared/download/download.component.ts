import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DownloadService } from 'src/app/services/download.service';

@Component({
    selector: 'app-download',
    templateUrl: './download.component.html',
    styleUrls: ['./download.component.less'],
    standalone: false
})
export class DownloadComponent {

  constructor(private downloadService: DownloadService){}
  @Input() currentDownloadableFile: BlobPart | null = null
  @Input() name: string = ''
  @Input() completedText: string = ''
  @Input() loadingText: string = ''

  async download() {
    if (this.currentDownloadableFile) {
      this.downloadService.downloadBlob(this.currentDownloadableFile, `${this.name}`, 'pdf')
    }
  }

}
