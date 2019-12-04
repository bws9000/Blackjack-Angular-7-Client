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

  private devUrl = 'http://localhost:5000';
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
    return this
      .http
      .get(`${this.devUrl}/env`, {responseType: 'json'});
  }

}
