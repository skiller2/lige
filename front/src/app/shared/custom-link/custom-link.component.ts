import { Component } from "@angular/core"
import { SharedModule } from "../shared.module"

@Component({
  standalone: true,
  imports: [
    SharedModule,
  ],
  template: `<a [routerLink]="[link,params]" > {{detail}} </a>`
})

export class CustomLinkComponent {
  item: any
  link!: string
  params!: any
  detail!:string
}
