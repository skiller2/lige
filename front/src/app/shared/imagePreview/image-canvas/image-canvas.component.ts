import { AfterViewInit, Component, ElementRef, Input, Renderer2, ViewChild } from '@angular/core';
import { map } from 'rxjs/operators';
import { FileImageService } from '../file-image.service'
import { changeDpiDataUrl } from '../../utils/changeDpi.js'
import { ContentSelectorComponent } from '../content-selector/content-selector.component';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-image-canvas',
  templateUrl: './image-canvas.component.html',
  styleUrls: ['./image-canvas.component.css']
})
export class ImageCanvasComponent implements AfterViewInit{
  @ViewChild('previewCanvas') previewCanvas: ElementRef<HTMLCanvasElement> | undefined = undefined
  previewCanvasContext: CanvasRenderingContext2D | undefined | null

  @Input() desiredWidth: number | null = null
  @Input() desiredHeight: number | null = null
  @Input() desiredDpi: number = 72

  $currentImageSource: Observable<string> = this.fileService.$currentImageData.pipe(map((imageData) => imageData ? imageData.src : ""))
  $isImage = this.fileService.$currentFile.pipe(map((file: File | undefined) => file ? true : false)) 

  currentImageData!: HTMLImageElement
  imageFileSize!: number
  scaleFactor: number = 0
  constructor(private renderer: Renderer2, public fileService: FileImageService){}


  ngAfterViewInit(){
    this.previewCanvasContext = this.previewCanvas?.nativeElement.getContext("2d")
    this.fileService.$currentImageData.subscribe((imageData) => {
      if (imageData){
        this.currentImageData = imageData
        this.renderer.setAttribute(this.previewCanvas?.nativeElement, 'width', this.desiredWidth ? `${this.desiredWidth}px` : `${imageData.width}px`)
        this.renderer.setAttribute(this.previewCanvas?.nativeElement, 'height', this.desiredWidth ? `${this.desiredHeight}px` : `${imageData.height}px`)
        let scaleFactor: number = this.scaleFactor
        let dX: number = 0
        let dY: number = 0
        if (imageData.width <= imageData.height) {
          scaleFactor = imageData.width / this.desiredWidth!
          dY = ((imageData.height) / scaleFactor - this.desiredHeight!) / 2  * -1
        }    
        if (imageData.height < imageData.width) {
          scaleFactor = imageData.height / this.desiredWidth!
          dX = ((imageData.width) / scaleFactor - this.desiredWidth!) / 2   * -1
        }
        this.scaleFactor = scaleFactor
        this.renderImage(imageData, dX, dY, imageData.width / scaleFactor, imageData.height / scaleFactor)

        this.imageFileSize = Math.floor(this.fileService.dataURLtoFile(this.previewCanvas?.nativeElement.toDataURL('image/jpeg')!, 'temp.jpg').size / 1024)
      }
    })
  }

  clearImage(){
    this.previewCanvasContext?.clearRect(0, 0, this.previewCanvas?.nativeElement.width!, this.previewCanvas?.nativeElement.height!)
  }

  renderImage(imageData: HTMLImageElement, dX: number, dY: number, sX: number, sY: number){
    this.previewCanvasContext?.drawImage(imageData, dX, dY, sX, sY)
  }
  renderSelectorImage(selectorPosition: {x: number, y: number, xP: number, yP: number, width: number, height: number}){
    this.clearImage()
    const dx: number = selectorPosition.xP * this.currentImageData.width * -1
    const dy: number = selectorPosition.yP * this.currentImageData.height * -1
    this.renderImage(this.currentImageData, dx, dy, selectorPosition.width * this.currentImageData.width / this.desiredWidth!, selectorPosition.height * this.currentImageData.height / this.desiredWidth!)
  }

  saveImage(source: HTMLImageElement | HTMLCanvasElement, button: HTMLButtonElement) {
    const link = button.children.item(0)! as HTMLAnchorElement
    this.renderer.setAttribute(link, 'download', 'temp.jpg')

    if (source instanceof HTMLCanvasElement){
      this.renderer.setAttribute(link, 'href', changeDpiDataUrl(source.toDataURL('image/jpeg'), 72))

    }
    if (source instanceof HTMLImageElement){
      fetch(source.src)
        .then((res) => res.blob())
        .then((blob) => {
            // Read the Blob as DataURL using the FileReader API
            const reader = new FileReader();
            reader.onloadend = () => {
                this.renderer.setAttribute(link, 'href', reader.result as string)
            };
            reader.readAsDataURL(blob);
        });
    }
    link.click()

  }
}
