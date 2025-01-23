import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChatComponent } from './chat.component';
import { ChatService } from 'src/app/core/services/chat.service';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

const routes: Routes = [
  {
    path: '',
    component: ChatComponent
  }
];

const config: SocketIoConfig = { 
  url: 'http://localhost:3000', 
  options: {
    transports: ['websocket']
  } 
};

@NgModule({
  declarations: [
    ChatComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    SocketIoModule.forRoot(config)
  ],
  providers: [
    ChatService
  ]
})
export class ChatModule { } 