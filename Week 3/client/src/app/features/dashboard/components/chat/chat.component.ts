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
  isConnected: boolean = false;
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

  private getStorageKey(username1: string, username2: string): string {
    // Sort usernames to ensure consistent key regardless of sender/receiver
    const users = [username1, username2].sort();
    return `chat_messages_${users[0]}_${users[1]}`;
  }

  private saveMessagesToStorage(otherUsername: string, messages: Message[]): void {
    const key = this.getStorageKey(this.currentUser.username, otherUsername);
    sessionStorage.setItem(key, JSON.stringify(messages));
    console.log('Saved messages to storage:', { key, messages });
  }

  private getMessagesFromStorage(otherUsername: string): Message[] {
    const key = this.getStorageKey(this.currentUser.username, otherUsername);
    const stored = sessionStorage.getItem(key);
    const messages = stored ? JSON.parse(stored) : [];
    console.log('Retrieved messages from storage:', { key, messages });
    return messages;
  }

  private addMessageToConversation(message: Message): void {
    const otherUsername = this.isOwnMessage(message) ? 
      (this.selectedUser?.username || message.sender.username) : 
      message.sender.username;
    
    // Get existing messages
    const existingMessages = this.getMessagesFromStorage(otherUsername);
    
    // Add new message if it doesn't exist already
    if (!existingMessages.some(m => 
        m.timestamp === message.timestamp && 
        m.sender.username === message.sender.username && 
        m.text === message.text)) {
      const updatedMessages = [...existingMessages, message];
      
      // Update storage
      this.saveMessagesToStorage(otherUsername, updatedMessages);
      
      // Update current view if this is the active conversation
      if (this.selectedUser && this.selectedUser.username === otherUsername) {
        this.messages = updatedMessages;
      }
    }
  }

  // Helper method to check if a message is from the current user
  isOwnMessage(message: Message): boolean {
    return message.sender.username === this.currentUser.username;
  }

  private updateUserNotification(senderUsername: string): void {
    const user = this.activeUsers.find(u => u.username === senderUsername);
    if (user && user !== this.selectedUser) {
      user.unreadCount = (user.unreadCount || 0) + 1;
      this.notificationSound.play().catch(err => console.log('Error playing sound:', err));
    }
  }

  private getGroupStorageKey(roomName: string): string {
    return `group_messages_${roomName}`;
  }

  private saveGroupMessagesToStorage(roomName: string, messages: Message[]): void {
    const key = this.getGroupStorageKey(roomName);
    sessionStorage.setItem(key, JSON.stringify(messages));
    console.log('Saved group messages to storage:', { key, messages });
  }

  private getGroupMessagesFromStorage(roomName: string): Message[] {
    const key = this.getGroupStorageKey(roomName);
    const stored = sessionStorage.getItem(key);
    const messages = stored ? JSON.parse(stored) : [];
    console.log('Retrieved group messages from storage:', { key, messages });
    return messages;
  }

  private addGroupMessage(message: Message): void {
    if (!this.currentRoom || message.room !== this.currentRoom) return;

    const existingMessages = this.getGroupMessagesFromStorage(this.currentRoom);
    
    // Check if message already exists using messageId
    if (!existingMessages.some(m => m.messageId === message.messageId)) {
      const updatedMessages = [...existingMessages, message];
      this.saveGroupMessagesToStorage(this.currentRoom, updatedMessages);
      this.messages = updatedMessages;
    }
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

  private setupSocketListeners(): void {
    // Handle active users updates
    this.chatService.getActiveUsers().subscribe(users => {
      console.log('Received active users from socket:', users);
      const uniqueUsers = users.reduce((acc: UserWithNotification[], user) => {
        if (user.username !== this.currentUser.username && 
            !acc.some(u => u.username === user.username)) {
          const existingUser = this.activeUsers.find(u => u.username === user.username);
          acc.push({
            ...user,
            unreadCount: existingUser?.unreadCount || 0
          });
        }
        return acc;
      }, []);
      
      this.activeUsers = uniqueUsers;
      console.log('Filtered active users:', this.activeUsers);
    });

    // Handle private messages
    this.chatService.getPrivateMessages().subscribe(message => {
      console.log('Received private message:', message);
      
      // Determine the other user in the conversation
      const otherUsername = this.isOwnMessage(message) ? 
        this.selectedUser?.username : message.sender.username;
      
      if (otherUsername) {
        // Always store the message
        this.addMessageToConversation(message);
        
        // Update UI if this is the current conversation
        if (this.selectedUser?.username === otherUsername) {
          const messages = this.getMessagesFromStorage(otherUsername);
          this.messages = messages;
        }
        
        // Update notification if message is from someone else
        if (!this.isOwnMessage(message) && 
            (!this.selectedUser || this.selectedUser.username !== message.sender.username)) {
          this.updateUserNotification(message.sender.username);
        }
      }
    });

    // Handle group messages
    this.chatService.getGroupMessages().subscribe(message => {
      console.log('Received group message:', message);
      this.addGroupMessage(message);
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
  selectUser(user: UserWithNotification): void {
    console.log('Selecting user:', user);
    this.chatMode = 'private';
    this.selectedUser = user;
    user.unreadCount = 0;
    
    // Load messages from storage
    this.messages = this.getMessagesFromStorage(user.username);
    
    this.currentRoom = null;
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
    
    // Load existing messages for this room
    this.messages = this.getGroupMessagesFromStorage(roomName);
    this.chatService.joinRoom(roomName);
  }

  leaveRoom(): void {
    if (this.currentRoom) {
      // Save messages before leaving
      if (this.messages.length > 0) {
        this.saveGroupMessagesToStorage(this.currentRoom, this.messages);
      }
      this.chatService.leaveRoom(this.currentRoom);
      this.currentRoom = null;
      this.messages = [];
    }
  }

  // Message sending
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

  ngOnDestroy(): void {
    // Save current conversation before destroying
    if (this.selectedUser && this.messages.length > 0) {
      this.saveMessagesToStorage(this.selectedUser.username, this.messages);
    }
    this.chatService.disconnect();
  }
}
