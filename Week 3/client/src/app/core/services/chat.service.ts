import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

export interface Message {
  text: string;
  sender: any;
  timestamp: Date;
  type: 'private' | 'group';
  room?: string;
  messageId?: string;
}

export interface User {
  id: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private socket: Socket) {}

  // Connection methods
  connect(userData: User): void {
    this.socket.emit('join', userData);
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  // User management
  getActiveUsers(): Observable<User[]> {
    return this.socket.fromEvent<User[]>('users');
  }

  // Private messaging
  sendPrivateMessage(to: string, message: string): void {
    this.socket.emit('private-message', { to, message });
  }

  getPrivateMessages(): Observable<Message> {
    return this.socket.fromEvent<Message>('private-message');
  }

  // Group chat methods
  createRoom(roomName: string): void {
    this.socket.emit('create-room', roomName);
  }

  joinRoom(roomName: string): void {
    this.socket.emit('join-room', roomName);
  }

  leaveRoom(roomName: string): void {
    this.socket.emit('leave-room', roomName);
  }

  sendGroupMessage(room: string, message: string): void {
    this.socket.emit('group-message', { room, message });
  }

  getGroupMessages(): Observable<Message> {
    return this.socket.fromEvent<Message>('group-message');
  }

  getRoomList(): Observable<string[]> {
    return this.socket.fromEvent<string[]>('room-list');
  }

  getRoomUsers(): Observable<{room: string, users: User[]}> {
    return this.socket.fromEvent<{room: string, users: User[]}>('room-users');
  }
}