import {AfterViewChecked, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {WebsocketService} from "../services/websocket.service";
import {environment} from "../../environments/environment";
import {Router} from '@angular/router';
import {Location} from '@angular/common';
import {StatusUpdateService} from "../services/status-update.service";
import {SeatService} from "../services/seat.service";
import {TableService} from "../services/table.service";
import {PlatformLocation} from '@angular/common'
import {HandService} from "../services/hand.service";
import {PlaceBetsService} from "../services/place-bets.service";
import {PlayerboxService} from "../services/playerbox.service";
import {StatusMessageService} from "../services/status-message.service";

@Component({
  selector: 'app-table-detail',
  templateUrl: './table-detail.component.html',
  styleUrls: ['./table-detail.component.css']
})

export class TableDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() player: string;
  watchers: any;
  players: any;
  playerSeats: Object;

  socketid: any;
  broadcast: any;

  constructor(private wss: WebsocketService,
              private statusUpdateService: StatusUpdateService,
              private seatService: SeatService,
              private tableService: TableService,
              private handService: HandService,
              private router: Router,
              private location: PlatformLocation,
              private placeBetsService: PlaceBetsService,
              private playerboxService: PlayerboxService,
              private sms: StatusMessageService) {

    this.logStuff('TABLE PLAYING: ' + this.tableService.tablePlaying);

    location.onPopState(() => {
      this.router.navigate(['/']).then((r) => {
        this.leaveTable();
      });
    });

    this.playerSeats = {};
    this.statusUpdateService.hideNavBar(false);

    this.statusUpdateService.watchersPlayers.subscribe(value => {
      let j = JSON.stringify(value);
      let o = JSON.parse(j);

      this.socketid = o.socketid;
      this.broadcast = o.broadcast;

      this.watchers = o.watcherCount;
      this.players = o.playerCount;

    });
  }

  leaveTable() {
    this.router.navigate(['/tables']).then((r) => {
      this.logStuff('no longer in room: table' + this.tableService.tableNum);
      let table = this.tableService.tableNum;
      this.wss.emit('leaveTable', {table: table});
    });
  }

  satDownTableEmit(data) {
    let broadcast = JSON.parse(data.broadcast);
    if (!broadcast) {
      this.wss.startChange.next(true);
      ///////////////////////////////////////////////////////////////////
      this.seatService.currentSeat = data.sitting; //where i am right now
      ///////////////////////////////////////////////////////////////////
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
    this.playerboxService.reset();//graphic
  }

  memberOfRoomEmit(data) {
    this.wss.startChange.next(true);
    if (!data.member) {
      this.router.navigate(['/tables']).then((r) => {
        this.logStuff('no longer in room: ' + JSON.stringify(data));
      });
    }
  }

  getHands(data) {
    this.logStuff(JSON.stringify(data));
    this.wss.startChange.next(true);


    this.placeBetsService.updateBanks(data.playerBanks);
    /* too soon, place bets first */
    //this.handService.getPlayerHands(data.playerHands);
    //this.handService.getDealerHand(data.dealerHand);
    //let d = JSON.stringify(data);
    //this.logStuff(d);
  }

  //CALLED FIRST WHEN 1st PLAYER SITS DOWN
  playersBetting(data) {
    this.wss.startChange.next(true);
    let d = JSON.stringify(data);
    /////////////////////////////////////////////////
    if(!data.broadcast) {
      this.tableService.tablePlaying = true;
      this.playerAction('betting');
    }
    /////////////////////////////////////////////////
    this.logStuff(d);
  }

  //AFTER FIRST PLAYER
  nextPlayerBetEmit(data){
    this.wss.startChange.next(true);
    if(data.nextPlayer) {
      this.placeBetsService.setStatus(false, data.nextPlayer);
    }
    //this.logStuff('nextPlayerBetEmit:');
    //this.logStuff(JSON.stringify(data));
  }

  playerAction(action) {
    let seat = this.seatService.currentSeat;
    let socketid = this.wss.socketId;
    let table = this.tableService.tableNum;
    this.wss.emit('playerAction', {
      action: action,
      id: socketid,
      table: table,
      seat: seat
    });
  }

  actionStatusEmit(data) {
    let broadcast = data.broadcast;
    if(!broadcast) {
      this.placeBetsService.currentBank = data.returnData;
      this.placeBetsService.setStatus(false, data.seat);
    }
    this.wss.startChange.next(true);
    this.logStuff('seat ' + data.seat + ' ' + data.action);
    this.playerboxService.setAction(data.seat);//graphic
    this.sms.statusMessage('Player ' + data.seat + ' is ' + data.action + '.');
    this.logStuff('current seat: ' + this.seatService.currentSeat);
  }

  ngOnInit() {

    if (this.wss.start) {

      let tableNum = this.tableService.tableNum;

      this.wss.emit('verifyRoomMember', {room: tableNum});

      this.wss
        .onEvent('memberOfRoomEmit')
        .subscribe(data => this.memberOfRoomEmit(data));

      this.wss
        .onEvent('satDownTableEmit')
        .subscribe(data => this.satDownTableEmit(data));

      this.wss
        .onEvent('standUpTableEmit')
        .subscribe(data => this.standUpTableEmit(data));

      this.wss
        .onEvent('getHandsEmit')
        .subscribe(data => this.getHands(data));

      this.wss
        .onEvent('playersBettingEmit')
        .subscribe(data => this.playersBetting(data));

      this.wss
        .onEvent('actionStatusEmit')
        .subscribe(data => this.actionStatusEmit(data));

      this.wss
        .onEvent('nextPlayerBetEmit')
        .subscribe(data => this.nextPlayerBetEmit(data));

    } else {
      this.router.navigate(['/tables']).then((r) => {
        //do something...
      })
    }
  }

  ngOnDestroy() {
    //leave room/table
    let table = this.tableService.tableNum;
    this.logStuff('NG ON DESTROY CALLED');
    this.wss.emit('leaveTable', {table: table});
    this.statusUpdateService.hideNavBar(true);
  }

  logStuff(stuff: any) {
    if (!environment.production) {
      console.log(stuff);
    }
  }

  ngAfterViewChecked(): void {
    //console.log('VIEWCHECKED');
  }

}
