import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';
import { ChatService, Message, User } from 'src/app/core/services/chat.service';

export interface UserWithNotification extends User {
  unreadCount?: number;
}
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  newMessage: string = '';
  activeUsers: UserWithNotification[] = [];
  selectedUser: UserWithNotification | null = null;
  currentUser: any;
  notificationSound: HTMLAudioElement;
  
  // Group chat properties
  rooms: string[] = [];
  currentRoom: string | null = null;
  roomUsers: User[] = [];
  newRoomName: string = '';
  chatMode: 'private' | 'group' = 'private';

  constructor(
    private authService: AuthService,
    private chatService: ChatService
  ) {
    this.currentUser = this.authService.getUserFromToken();
    console.log('Initial current user:', this.currentUser);
    this.notificationSound = new Audio('../../../assets/sounds/notification.mp3');
  }

  ngOnInit(): void {
    if (this.currentUser) {
      console.log('Current user before connect:', this.currentUser);
      this.chatService.connect(this.currentUser);
      this.setupSocketListeners();
    } else {
      console.log('No current user found in ngOnInit');
    }
  }

  ngOnDestroy(): void {
    this.chatService.disconnect();
  }

  private setupSocketListeners(): void {
    this.chatService.getActiveUsers().subscribe(users => {
      console.log('Received active users from socket:', users);
      this.activeUsers = users.map((user: User) => ({ ...user, unreadCount: 0 })).filter(u => u.username !== this.currentUser.username);
      console.log('Filtered active users:', this.activeUsers);
    });

    this.chatService.getPrivateMessages().subscribe(message => {
      console.log('Received private message:', message);
      const otherUsername = message.sender.username;
      if (otherUsername) {
        this.addMessageToConversation(message);
        if (!this.isOwnMessage(message) && 
            (!this.selectedUser || this.selectedUser.username !== message.sender.username)) {
          this.updateUserNotification(message.sender.username);
        }
      }
    });

    this.chatService.getGroupMessages().subscribe(message => {
      console.log('Received group message:', message);
      this.addGroupMessage(message);
    });

    this.chatService.getRoomList().subscribe(rooms => {
      this.rooms = rooms;
    });

    this.chatService.getRoomUsers().subscribe(({ room, users }) => {
      if (this.currentRoom === room) {
        this.roomUsers = users;
      }
    });
  }

  isOwnMessage(message: Message): boolean {
    return message.sender.username === this.currentUser.username;
  }

  private addMessageToConversation(message: Message): void {
    const otherUsername = this.isOwnMessage(message) ? 
      (this.selectedUser?.username || message.sender.username) : 
      message.sender.username;
    const existingMessages = this.getMessagesFromStorage(otherUsername);
    if (!existingMessages.some(m => 
        m.timestamp === message.timestamp && 
        m.sender.username === message.sender.username && 
        m.text === message.text)) {
      const updatedMessages = [...existingMessages, message];
      this.saveMessagesToStorage(otherUsername, updatedMessages);
      if (this.selectedUser && this.selectedUser.username === otherUsername) {
        this.messages = updatedMessages;
      }
    }
  }

  private getMessagesFromStorage(otherUsername: string): Message[] {
    const key = this.getStorageKey(this.currentUser.username, otherUsername);
    const stored = sessionStorage.getItem(key);
    const messages = stored ? JSON.parse(stored) : [];
    console.log('Retrieved messages from storage:', { key, messages });
    return messages;
  }

  private saveMessagesToStorage(otherUsername: string, messages: Message[]): void {
    const key = this.getStorageKey(this.currentUser.username, otherUsername);
    sessionStorage.setItem(key, JSON.stringify(messages));
    console.log('Saved messages to storage:', { key, messages });
  }

  private getStorageKey(username1: string, username2: string): string {
    const users = [username1, username2].sort();
    return `chat_messages_${users[0]}_${users[1]}`;
  }

  private updateUserNotification(senderUsername: string): void {
    const user = this.activeUsers.find(u => u.username === senderUsername);
    if (user && user !== this.selectedUser) {
      user.unreadCount = (user.unreadCount || 0) + 1;
      this.notificationSound.play().catch(err => console.log('Error playing sound:', err));
    }
  }

  private addGroupMessage(message: Message): void {
    if (!this.currentRoom || message.room !== this.currentRoom) return;
    const existingMessages = this.getGroupMessagesFromStorage(this.currentRoom);
    if (!existingMessages.some(m => m.messageId === message.messageId)) {
      const updatedMessages = [...existingMessages, message];
      this.saveGroupMessagesToStorage(this.currentRoom, updatedMessages);
      this.messages = updatedMessages;
    }
  }

  private getGroupMessagesFromStorage(roomName: string): Message[] {
    const key = this.getGroupStorageKey(roomName);
    const stored = sessionStorage.getItem(key);
    const messages = stored ? JSON.parse(stored) : [];
    console.log('Retrieved group messages from storage:', { key, messages });
    return messages;
  }

  private saveGroupMessagesToStorage(roomName: string, messages: Message[]): void {
    const key = this.getGroupStorageKey(roomName);
    sessionStorage.setItem(key, JSON.stringify(messages));
    console.log('Saved group messages to storage:', { key, messages });
  }

  private getGroupStorageKey(roomName: string): string {
    return `group_messages_${roomName}`;
  }

  selectUser(user: UserWithNotification): void {
    console.log('Selecting user:', user);
    this.chatMode = 'private';
    this.selectedUser = user;
    user.unreadCount = 0;
    this.messages = this.getMessagesFromStorage(user.username);
    this.currentRoom = null;
  }

  createRoom(): void {
    if (this.newRoomName.trim()) {
      this.chatService.createRoom(this.newRoomName.trim());
      this.newRoomName = '';
    }
  }

  joinRoom(roomName: string): void {
    this.chatMode = 'group';
    this.currentRoom = roomName;
    this.selectedUser = null;
    this.messages = this.getGroupMessagesFromStorage(roomName);
    this.chatService.joinRoom(roomName);
  }

  leaveRoom(): void {
    if (this.currentRoom) {
      this.chatService.leaveRoom(this.currentRoom);
      this.currentRoom = null;
      this.messages = [];
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    if (this.chatMode === 'private' && this.selectedUser) {
      console.log('Sending private message to:', this.selectedUser);
      this.chatService.sendPrivateMessage(this.selectedUser.id, this.newMessage.trim());
    } else if (this.chatMode === 'group' && this.currentRoom) {
      console.log('Sending group message to room:', this.currentRoom);
      this.chatService.sendGroupMessage(this.currentRoom, this.newMessage.trim());
    }
    this.newMessage = '';
  }
}