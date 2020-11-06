import { NgModule, Injectable } from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";

@Injectable()
@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class InitModule {

  private appUrl = (environment.production) ?
    'https://blackjackgame.us' : 'http://localhost:5000';
  env;

  constructor(private http: HttpClient) {
  }

  init() {

    return new Promise<void>((resolve, reject) => {
      this.logStuff("init.module");
      console.log('devpass: ' + environment.devpass);
      console.log('socketurl ' + environment.socketurl);
      console.log('devsocketurl ' + environment.devsocketurl);
      resolve();
      // return this.getEnv()
      //   .subscribe((data: '') => {
      //     let s = JSON.stringify(data);
      //     this.env = JSON.parse(s);
      //     environment.devpass = this.env.devpass;
      //     environment.socketurl = this.env.socketurl;
      //     environment.devsocketurl = this.env.devsocketurl;
      //     resolve();
      //   });

    });

  }

  getEnv() {
    this.logStuff('environment: ' + this.appUrl);
    return this
      .http
      .get(`${this.appUrl}/env`, {responseType: 'json'});
  }

  logStuff(stuff: any) {
    if (!environment.production) {
      console.log(stuff);
    }
  }

}
