import { Component, OnInit, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';

interface Message {
  text: string;
  sent: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  private socket: Socket;
  messages: Message[] = [];
  newMessage: string = '';
  isConnected: boolean = false;

  constructor() {
    this.socket = io('http://localhost:3000');
  }

  ngOnInit(): void {
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('message', (message: string) => {
      this.messages.push({
        text: message,
        sent: false,
        timestamp: new Date()
      });
    });
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.socket.emit('message', this.newMessage);
      this.messages.push({
        text: this.newMessage,
        sent: true,
        timestamp: new Date()
      });
      this.newMessage = '';
    }
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
