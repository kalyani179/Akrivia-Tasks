import { Component } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  files = [
    { name: 'Tech requirements.pdf', size: '200 KB', type: 'pdf' },
    { name: 'Dashboard screenshot.jpg', size: '720 KB', type: 'image' },
    { name: 'Dashboard prototype recording.mp4', size: '16 MB', type: 'video' }
  ];

  onUpload(event: any) {
    // Handle file upload
  }
}