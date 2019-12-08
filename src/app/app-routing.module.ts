import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {TableSelectComponent} from "./table-select/table-select.component";
import {SocketConnectComponent} from "./socket-connect/socket-connect.component";

const routes: Routes = [
  {
    path: '', component: SocketConnectComponent
  },
  {
    path: 'tables', component: TableSelectComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
