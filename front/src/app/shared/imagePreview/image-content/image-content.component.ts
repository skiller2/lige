import { Component, Input } from '@angular/core';
import { base64ToFile, Dimensions, ImageCroppedEvent, ImageTransform, LoadedImage } from 'ngx-image-cropper';
import { BehaviorSubject, map } from 'rxjs';
import { changeDpiDataUrl } from '../../utils/changeDpi.js'

@Component({
    selector: 'app-image-content',
    templateUrl: './image-content.component.html',
    styleUrls: ['./image-content.component.css']
})
export class ImageContentComponent {

    @Input() personalImage: Blob = new Blob()

    imageChangedEvent: any = '';
    croppedImage: any = '';
    $croppedImageFile = new BehaviorSubject<Blob>(new Blob())
    $croppedImageFileSize = this.$croppedImageFile.pipe(map((blob) => blob.size))
    croppedImageSize: number = 0
    showCropper = false;

    fileChangeEvent(event: any): void {
        this.imageChangedEvent = event;
    }

    imageCropped(event: ImageCroppedEvent) {
        this.croppedImage = changeDpiDataUrl(event.base64, 72);
        this.$croppedImageFile.next(base64ToFile(event.base64!))
        console.log(event, this.$croppedImageFile.value);
    }

    imageLoaded() {
        this.showCropper = true;
        console.log('Image loaded');
    }

    cropperReady(sourceImageDimensions: Dimensions) {
        console.log('Cropper ready', sourceImageDimensions);
    }

    loadImageFailed() {
        console.log('Load failed');
    }

}
