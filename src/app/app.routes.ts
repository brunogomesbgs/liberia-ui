import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ChatComponent } from './components/chat/chat.component';
import { BookListComponent } from './components/book-list/book-list.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'books', component: BookListComponent },
  { path: 'chat/:id', component: ChatComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
