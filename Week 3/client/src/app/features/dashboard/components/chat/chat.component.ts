import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';
import { ChatService, Message, User } from 'src/app/core/services/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  newMessage: string = '';
  isConnected: boolean = false;
  activeUsers: User[] = [];
  selectedUser: User | null = null;
  currentUser: any;
  
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
  }

  ngOnInit(): void {
    if (this.currentUser) {
      this.chatService.connect(this.currentUser);
      this.setupSocketListeners();
    }
  }

  private setupSocketListeners(): void {
    // Handle active users updates
    this.chatService.getActiveUsers().subscribe(users => {
      this.activeUsers = users.filter(user => user.id !== this.currentUser.id);
    });

    // Handle private messages
    this.chatService.getPrivateMessages().subscribe(message => {
      if (
        (this.selectedUser && message.sender.id === this.selectedUser.id) ||
        message.sender.id === this.currentUser.id
      ) {
        this.messages.push(message);
      }
    });

    // Handle group messages
    this.chatService.getGroupMessages().subscribe(message => {
      if (this.currentRoom && message.room === this.currentRoom) {
        this.messages.push(message);
      }
    });

    // Handle room list updates
    this.chatService.getRoomList().subscribe(rooms => {
      this.rooms = rooms;
    });

    // Handle room users updates
    this.chatService.getRoomUsers().subscribe(({ room, users }) => {
      if (this.currentRoom === room) {
        this.roomUsers = users;
      }
    });
  }

  // User selection
  selectUser(user: User): void {
    this.chatMode = 'private';
    this.selectedUser = user;
    this.currentRoom = null;
    this.messages = [];
  }

  // Room management
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
    this.messages = [];
    this.chatService.joinRoom(roomName);
  }

  leaveRoom(): void {
    if (this.currentRoom) {
      this.chatService.leaveRoom(this.currentRoom);
      this.currentRoom = null;
      this.messages = [];
    }
  }

  // Message sending
  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    if (this.chatMode === 'private' && this.selectedUser) {
      this.chatService.sendPrivateMessage(this.selectedUser.id, this.newMessage.trim());
    } else if (this.chatMode === 'group' && this.currentRoom) {
      this.chatService.sendGroupMessage(this.currentRoom, this.newMessage.trim());
    }

    this.newMessage = '';
  }

  ngOnDestroy(): void {
    this.chatService.disconnect();
  }
}
