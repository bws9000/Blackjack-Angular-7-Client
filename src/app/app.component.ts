import {AfterViewInit, Component, OnInit} from '@angular/core';
import {SlimLoadingBarService} from 'ng2-slim-loading-bar';
import {Location} from '@angular/common';

import {Event, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router} from '@angular/router';
import {WebsocketService} from "./services/websocket.service";
import {environment} from "../environments/environment";
import {StatusUpdateService} from "./services/status-update.service";
import {SeatService} from "./services/seat.service";
import {PlayerboxService} from "./services/playerbox.service";
import {TableService} from "./services/table.service";
import {PlaceBetsService} from "./services/place-bets.service";
import {StatusMessageService} from "./services/status-message.service";
import {HandService} from "./services/hand.service";
import {PlayerDashService} from "./services/player-dash.service";
import {DashStatusServiceService} from "./services/dash-status-service.service";
import {Observable, Subscription} from "rxjs";
import {MultiDashService} from "./services/multi-dash.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {

  private noActivityTimer;
  private noActivitySubTimer: Subscription;
  private noActivityCount;

  loadingWheelVisible: string;
  isHidden: boolean;
  count: number;

  private timer;
  private subTimer: Subscription;

  constructor(private loadingBar: SlimLoadingBarService,
              private wss: WebsocketService,
              private statusUpdateService: StatusUpdateService,
              private router: Router,
              private location: Location,
              private seatService: SeatService,
              private playerboxService: PlayerboxService,
              private tableService: TableService,
              private placeBetsService: PlaceBetsService,
              private sms: StatusMessageService,
              private handService: HandService,
              private playerDashService: PlayerDashService,
              private dss: DashStatusServiceService,
              private mdService: MultiDashService) {

    this.router.events.subscribe((event: Event) => {
      this.navigationInterceptor(event);
    });

    this.wss.startChange.subscribe(value => {
      if (value) {
        this.loadingWheelVisible = 'hidden';
      } else {
        this.loadingWheelVisible = 'visible';
      }
    });


    this.statusUpdateService.navBarVisible.subscribe(value => {
      this.isHidden = !value;
    });
    this.statusUpdateService.hideNavBar(true);


    //////// reload due to non activity ??? /////////
    this.noActivityCount = 30;
    this.noActivityTimer = Observable.timer(1000, 1000);
    //this.noActivitySubTimer = this.noActivityTimer.subscribe(t => this.noActivityReload(t));
    /////////////////////////////////////////////////

  }

  ngAfterViewInit(): void {
    //this.elementRef.nativeElement.ownerDocument.body.style.backgroundColor = 'black';
  }

  ///////////////////////////////////////////////////////
  joinTable(data) {

    let tableNum = data.tableNum;
    let tableName = 'table' + tableNum;
    this.router.navigate(['/tables/' + tableName]).then(async r => {
      this.wss.startChange.next(true);
      let playerSeats = JSON.parse(data.playerSeats);
      let s = [];
      for (let i = 0; i < playerSeats.length; i++) {
        s.push(playerSeats[i][1]);
      }
      await this.seatService.setInitState(s, tableNum);
    });
  }

  leftTable(data) {
    this.router.navigate(['/tables']).then(r => {
      this.wss.startChange.next(true);
    });
    let result = JSON.stringify((data));
    this.logStuff('EMIT LEFT TABLE: ' + result);
  }

  socketReconnect(data) {
    this.router.navigate(['']).then(r => {
      this.wss.startChange.next(true);
      this.connect().then(r => {
        this.logStuff('CONNECTION TYPE: Reconnection Occured.');
      })
    });
    this.logStuff('Reconnection occured: Booted from room'); //temp
    let result = JSON.stringify((data));
    this.logStuff(result);
  }

  tableDetailHeartBeat(data) {
    this.count++;
    this.statusUpdateService.watchPlay(data);
    this.seatService.updateSeats(data.playerSeats);
    this.playerboxService.seats(data.playerSeats);
  }

  init(data) {
    this.wss.socketId = data.socketid;
  }

  ////////////////////////////////////////////////////////
  ////////////////// table emit //////////////////////////
  ////////////////////////////////////////////////////////

  playerAction(data) {

    this.wss.startChange.next(true);
    this.sms.statusMessage(data.status);

    this.handService.getPlayerHands(data.playerHands);
    this.handService.getDealerHand(data.dealerHand);

    this.logStuff('playerAction: ' + JSON.stringify(data));

    let result = data.result;
    let seat = data.seat;
    let tableName = data.table;
    let broadcast = data.broadcast;
    //this.dss.activate(result, seat, tableName, seat, broadcast);
  }

  /*
  getHands(data) {

    this.logStuff('getHands: ' + JSON.stringify(data));

    this.wss.startChange.next(true);

    this.handService.getPlayerHands(data.playerHands);
    this.handService.getDealerHand(data.dealerHand);

    let result = data.result;
    let seat = data.justBet;
    let tableName = data.table;
    let nextPlayer = data.nextPlayer;
    let broadcast = data.broadcast;

    this.updateVisibleDash(nextPlayer, result);

    this.dss.activate(result, seat, tableName, nextPlayer, broadcast);//seat/nextPlayer

    this.sms.statusMessage("player " + data.nextPlayer + " is playing");

    if (data.nextPlayer === undefined) {
      //DEALER TURN
      this.sms.statusMessage("dealer playing");
      this.handService.showDealerHiddenCard(data.dealerHand);
      this.wss.emit('dealerHand', {
        table: this.tableService.tableNum,
        socketid: this.wss.socketId
      });
    }
  }
  */

  /*
  updateVisibleDash(nextPlayer, result) {
    //this.logStuff('O o O o ================');
    //his.logStuff('nextPlayer: ' + nextPlayer);
    //this.logStuff('O o O o ================');
    this.playerDashService.updateVisible(true, nextPlayer);
    this.handService.handResult = result;
  }
  */

  dealerHandEmit(data) {

    this.wss.startChange.next(true);
    this.handService.showAllDealerHand(data.dealerHand);

    let visible = true;
    let dealerResult = data.result;
    let playerResult = data.phResult;
    let dealerHandArray = data.dealerHand[0].hand;
    let playerHandArray = data.playerHand.hand;
    let playerQue = data.playerQue;
    let inPlayerQue = (playerQue !== undefined) ? playerQue.indexOf(this.seatService.currentSeat) : false;

    if (this.seatService.sitting && inPlayerQue) {
      this.mdService.updateVisible(visible, dealerResult, playerResult,
        dealerHandArray, playerHandArray);
    }else{
      this.wss.emit('checkDone',
        {
          table: this.tableService.tableNum,
          seat: this.seatService.currentSeat,
          deactivated:true
        });
    }

    this.logStuff('dealerHandEmit => ' + JSON.stringify(data));
  }

  //1st PLAYER SITS DOWN
  /*
  playersBetting(data) {
    this.logStuff('*: ' + JSON.stringify(data));
    let seats = data.seats;
    this.placeBetsService.currentBank = 0;
    this.wss.startChange.next(true);
    this.tableService.tablePlaying = true;
    this.placeBetsService.setVisible(true, seats);
    //this.sms.statusMessage(data.status);//player x is betting
  }
  */

  openBetDash(data) {
    this.wss.startChange.next(true);
    this.logStuff(JSON.stringify(data));
    let allActiveSeatsArray = data.allActiveSeatsArray;
    this.placeBetsService.setVisible(true, allActiveSeatsArray);
    //this.placeBetsService.currentBank = data.chips;
    //this.placeBetsService.setStatus(false, seat);
  }

  openPlayerDash(data) {

    this.logStuff('openPlayerDash: ' + JSON.stringify(data));

    this.wss.startChange.next(true);

    this.handService.getPlayerHands(data.playerHands);
    this.handService.getDealerHand(data.dealerHand);
    let result = data.result;
    let currentSeat = data.currentSeat;

    //this.dss.activate(result, tableName, currentSeat, broadcast);//seat/nextPlayer

    this.playerDashService.updateVisible(true, currentSeat);
    this.handService.handResult = result;
    this.sms.statusMessage("player " + currentSeat + " is playing");


    /*
    if (data.nextPlayer === undefined) {
      //DEALER TURN
      this.sms.statusMessage("dealer playing");
      this.handService.showDealerHiddenCard(data.dealerHand);
      this.wss.emit('dealerHand', {
        table: this.tableService.tableNum,
        socketid: this.wss.socketId
      });
    }
    */


    /*
    if (data.nextPlayer === this.seatService.currentSeat) {
      this.wss.emit('tablePlaying', {
        table: this.tableService.tableNum,
        seat: data.nextPlayer,
        socketid: this.wss.socketId
      });
    }
    */

  }

  standUpTableEmit(data) {
    if (!data.broadcast) {
      this.wss.startChange.next(true);
    }
    this.seatService.standUp(
      data.standing,
      data.broadcast,
      data.tableName);

    //remove hands
    if (this.seatService.currentSeats < 2) {
      this.tableService.tablePlaying = false;
    }
    this.handService.seatStand(data.standing);
    //this.seatService.currentSeat = undefined;

    //green graphic
    //this.playerboxService.reset(this.seatService.currentSeat);
    //this.playerboxService.reset(data.standing);
  }


  satDownTableEmit(data) {

    let broadcast = JSON.parse(data.broadcast);

    if (!broadcast) {
      this.wss.startChange.next(true);
      this.seatService.currentSeat = data.sitting; //where i am right now
      if (data.playerCount === 1) {
        this.statusUpdateService.showStatus();
      }
    }

    if (!broadcast) {
      if (this.tableService.tablePlaying) {

      }
    }

    this.seatService.sitDown(
      data.sitting,
      data.broadcast,
      data.tableName);
  }

  actionSeat(data) {
    this.wss.startChange.next(true);
    //this.logStuff('actionSeat: ' + JSON.stringify(data));
    this.playerboxService.setAction(data.actionSeat, data.broadcast, true);//green playerbox
  }

  ////////////////////////////////////////////////////
  ////////////////////////////////////////////////////

  /*
 // it shouldn't take longer
 // than 30 seconds to pick a room
 */
  noActivityReload(t) {
    this.noActivityCount--;
    if (this.noActivityCount === 0) {
      this.noActivityCount = 30;
      window.location.reload();
      this.noActivitySubTimer.unsubscribe();
    }
  }

  async connect(): Promise<void> {

    this.wss.startChange.next(false);

    let result = await this.wss.authConnect();
    if (result) {

      this.wss.startChange.next(true);
      this.wss.initEvents();


      /////////////////// User Events /////////////////////////
      /////////////////////////////////////////////////////////

      /*
      this.wss
        .onEvent('restartHandsEmit')
        .subscribe(data => this.restartHands(data));
      */

      this.wss
        .onEvent('actionSeatEmit')
        .subscribe(data => this.actionSeat(data));

      this.wss
        .onEvent('playerActionEmit')
        .subscribe(data => this.playerAction(data));

      this.wss
        .onEvent('initEmit')
        .subscribe(data => this.init(data));

      this.wss
        .onEvent('joinTableEmit')
        .subscribe(data => this.joinTable(data));

      this.wss
        .onEvent('leftTableEmit')
        .subscribe(data => this.leftTable(data));

      this.wss
        .onEvent('socketReconnect')
        .subscribe(data => this.socketReconnect(data));

      this.wss
        .onEvent('tableDetailHeartBeat')
        .subscribe(data => this.tableDetailHeartBeat(data));


      //////////////////////////////TABLE///////////////////////////
      this.wss
        .onEvent('satDownTableEmit')
        .subscribe(data => this.satDownTableEmit(data));

      this.wss
        .onEvent('openBetDashEmit')
        .subscribe(data => this.openBetDash(data));

      this.wss
        .onEvent('openPlayerDashEmit')
        .subscribe(data => this.openPlayerDash(data));

      /*
      this.wss
        .onEvent('playersBettingEmit')
        .subscribe(data => this.playersBetting(data));
      */

      /*
      this.wss
        .onEvent('getHandsEmit')
        .subscribe(data => this.getHands(data));
       */

      this.wss
        .onEvent('standUpTableEmit')
        .subscribe(data => this.standUpTableEmit(data));

      this.wss
        .onEvent('dealerHandEmit')
        .subscribe(data => this.dealerHandEmit(data));

      ////////////////// Environment Updates //////////////////////
      /////////////////////////////////////////////////////////////
      //
    }
  }

  ngOnInit() {

    this.count = 0;

    this.connect().then(r => {
      this.logStuff('RECONNECTION TYPE: Initial Connection Occured.');
    })
  }

  private navigationInterceptor(event: Event): void {
    if (event instanceof NavigationStart) {
      this.loadingBar.start();
    }
    if (event instanceof NavigationEnd) {
      this.loadingBar.complete();
    }
    if (event instanceof NavigationCancel) {
      this.loadingBar.stop();
    }
    if (event instanceof NavigationError) {
      this.loadingBar.stop();
    }
  }

  logStuff(stuff: any) {
    if (!environment.production) {
      console.log(stuff);
    }
  }

}
