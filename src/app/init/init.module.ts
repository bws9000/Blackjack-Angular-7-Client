import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class InitModule {

  private url = (environment.production) ?
    'http://localhost:5000' : 'https://bj-angular-client.herokuapp.com';
  env;

  constructor(private http: HttpClient) {
  }

  init() {

    return new Promise<void>((resolve, reject) => {
      console.log("init()");

      return this.getEnv()
        .subscribe((data: '') => {
          let s = JSON.stringify(data);
          this.env = JSON.parse(s);
          environment.devpass = this.env.devpass;
          environment.socketurl = this.env.socketurl;
          environment.devsocketurl = this.env.devsocketurl;
          console.log(environment.devsocketurl);
          console.log(environment.devpass);
          console.log(environment.socketurl);
          resolve();
        });

    });
  }

  getEnv() {
    console.log('environment: ' + environment.socketurl);
    return this
      .http
      .get(`${this.url}/env`, {responseType: 'json'});
  }

}
