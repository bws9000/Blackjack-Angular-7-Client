import {Injectable} from '@angular/core';
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DashStatusServiceService {

  statusMessage: Subject<Object> = new Subject<Object>();
  startTimerCount: Subject<string> = new Subject<string>();


  constructor() {

  }

  /*
  activate(result, tableName, currentSeat, broadcast) {
    let data = {
      result: result,
      tableName: tableName,
      currentSeat: currentSeat,
      broadcast: broadcast
    };
    this.statusMessage.next(data);
  }
   */

  startTimer(seat) {
    this.startTimerCount.next(seat);
  }

}
