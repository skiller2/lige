import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2, ViewChild } from '@angular/core';

@Component({
  selector: 'app-content-selector',
  templateUrl: './content-selector.component.html',
  styleUrls: ['./content-selector.component.css']
})
export class ContentSelectorComponent implements AfterViewInit {

  @Input() selectorWidth: number = 91
  @Input() selectorHeight: number = 91
  @Input() currentImageSource: string | null = ''

  @Output() mouseMoveEvent = new EventEmitter<any>()

  @ViewChild('contentSelector') contentSelector!: ElementRef<HTMLDivElement>
  @ViewChild('image') image!: ElementRef<HTMLImageElement>

  isMovable: boolean = true
  selectorPosition = {
    x: 0,
    y: 0,
    xP: 0,
    yP: 0,
    width: 0,
    height: 0
  }

  constructor(private renderer: Renderer2) {}

  @HostListener('window:mousemove', ['$event'])
  handleMouseMove(event: MouseEvent) {

    if (!this.isMovable) return
    const mousePos = this.getMousePos(event)
    this.updateSelectorPos(mousePos)
    this.mouseMoveEvent.emit(this.selectorPosition)
  }

  ngAfterViewInit(): void {
      this.contentSelector.nativeElement.style.width = `${this.selectorWidth}px`
      this.contentSelector.nativeElement.style.height = `${this.selectorHeight}px`
    }

  updateSelectorPos(position: {x: number, y: number}): void {
    const newPosition = {x: 0, y: 0}
    newPosition.x = position.x - this.contentSelector.nativeElement.clientWidth /2
    newPosition.y = position.y - this.contentSelector.nativeElement.clientHeight /2
    this.contentSelector.nativeElement.style.left = `${newPosition.x}px`
    this.contentSelector.nativeElement.style.top = `${newPosition.y}px`
    if (this.contentSelector.nativeElement.offsetLeft < 0) this.contentSelector.nativeElement.style.left = `0px`
    if (this.contentSelector.nativeElement.offsetLeft > this.contentSelector.nativeElement.parentElement?.clientWidth! - this.contentSelector.nativeElement.clientWidth) this.contentSelector.nativeElement.style.left = `${this.contentSelector.nativeElement.parentElement!.clientWidth - this.contentSelector.nativeElement.clientWidth}px`
    if (this.contentSelector.nativeElement.offsetTop < 0) this.contentSelector.nativeElement.style.top = `0px`
    if (this.contentSelector.nativeElement.offsetTop > this.contentSelector.nativeElement.parentElement?.clientHeight! - this.contentSelector.nativeElement.clientHeight) this.contentSelector.nativeElement.style.top = `${this.contentSelector.nativeElement.parentElement!.clientHeight - this.contentSelector.nativeElement.clientHeight}px`

    this.selectorPosition.x = this.contentSelector.nativeElement.offsetLeft
    this.selectorPosition.y = this.contentSelector.nativeElement.offsetTop
    this.selectorPosition.xP = this.contentSelector.nativeElement.offsetLeft / this.image.nativeElement.width
    this.selectorPosition.yP = this.contentSelector.nativeElement.offsetTop / this.image.nativeElement.height
    this.selectorPosition.width = this.contentSelector.nativeElement.clientWidth
    this.selectorPosition.height = this.contentSelector.nativeElement.clientHeight
  }

  private getMousePos(event: MouseEvent) {
    const bounds = this.image.nativeElement.getBoundingClientRect()
    return {
      x: event.clientX - bounds.x,
      y: event.clientY - bounds.y
    }
  }
}
