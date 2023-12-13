import { Component } from "@angular/core"
import { RouterLink } from "@angular/router"
import { SHARED_IMPORTS } from "@shared"

@Component({
  standalone: true,
  imports: [ ...SHARED_IMPORTS, RouterLink],
  template: `<a [routerLink]="[link,params]" > {{detail}} </a>`
})

export class CustomLinkComponent {
  item: any
  link!: string
  params!: any
  detail!:string
}
