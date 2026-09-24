import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { ImageLoaderComponent } from '../image-loader/image-loader.component';

@Component({
  templateUrl: './novedades-row-detail-view.html',
  styleUrl: './novedades-row-detail-view.less',
  imports: [...SHARED_IMPORTS, ImageLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovedadesRowDetailView implements OnInit {

  // Estos objetos son proporcionados por Angular-SlickGrid
  addon: any;
  model: any;
  parent: any;

  imagenes = signal<any[]>([]);
  loading = signal(false);
  error = signal(false);

  documentoIds = signal<number[]>([]);

  ngOnInit(): void {
    const documentoId = this.model?.DocumentoId;
    console.log('documentoId: ', documentoId);
    
    if (!documentoId) {
      return;
    }

    const ids = String(documentoId)
      .split(',')
      .map(id => Number(id.trim()))
      .filter(id => !isNaN(id) && id > 0);

    this.imagenes.set(
      ids.map(id => `api/file-upload/downloadFile/${id}/Documento/image`)
    );
  }

}