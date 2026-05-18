import { Component, input, Input } from '@angular/core';
import { base64ToFile, Dimensions, ImageCroppedEvent, ImageCropperModule, ImageTransform, LoadedImage } from 'ngx-image-cropper';
import { BehaviorSubject, map } from 'rxjs';
import { changeDpiDataUrl } from '../../utils/changeDpi.js'
import { SHARED_IMPORTS } from '@shared'
import { CommonModule} from '@angular/common';
import { FormComponent } from '../form/form.component';

@Component({
    selector: 'app-image-content',
    templateUrl: './image-content.component.html',
    styleUrls: ['./image-content.component.css'],
    imports: [...SHARED_IMPORTS, CommonModule, ImageCropperModule, FormComponent]
})
export class ImageContentComponent {
//    @Input() personalImage = ''
    @Input() imageCroppedDpi:number = 72
    @Input() imageCroppedX:number = 91
    @Input() imageCroppedY:number = 91
    @Input() nombreDescarga: string = ''
    personalImageUrl = input('')

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
        this.croppedImage = changeDpiDataUrl(event.base64, this.imageCroppedDpi);
        this.$croppedImageFile.next(base64ToFile(event.base64!))
 
    }

    imageLoaded() {
        this.showCropper = true;
 
    }

    cropperReady(sourceImageDimensions: Dimensions) {
 
    }

    loadImageFailed() {
 
    }


    saveImage() {
        const link = document.createElement('a')
        link.setAttribute('download', this.nombreDescarga + '.jpg')
        link.setAttribute('href', this.croppedImage)
        link.click()
    }
}
