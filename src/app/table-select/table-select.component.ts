import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {WebsocketService} from "../services/websocket.service";
import {environment} from "../../environments/environment";
import {TableService} from "../services/table.service";
import {PlatformLocation} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import {MatDialog, MatDialogConfig, MatDialogRef} from "@angular/material/dialog";
import {DialogExampleComponent} from "../dialog-example/dialog-example.component";

@Component({
  selector: 'app-table-select',
  templateUrl: './table-select.component.html',
  styleUrls: ['./table-select.component.css']
})
export class TableSelectComponent implements OnInit, AfterViewInit, OnDestroy {

  checked: boolean;
  tableArray: Array<Object>;
  config: MatDialogConfig;
  dialogRef: any;

  constructor(private http: HttpClient,
              private wss: WebsocketService,
              private tableService: TableService,
              private router: Router,
              private location: PlatformLocation,
              private route: ActivatedRoute,
              public dialog: MatDialog) {


    this.checked = true;
    this.tableArray = this.tableService.getTables();
    // let j = JSON.stringify(tables);
    // this.logStuff(j);

    this.config = new MatDialogConfig();
    this.config.disableClose = false;
    this.config.autoFocus = true;
    this.config.data = {checked: this.checked};
    this.config.height = '60%';
    this.config.width = '60%';
    this.config.hasBackdrop = true;
    this.config.panelClass = ['custom-dialog'];
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogExampleComponent, this.config);
    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.wss.emit('getTables', {
          add: true,
          result:result
        })
      } else {
        alert('error adding table');
      }
      //console.log('The dialog was closed');
      //console.log('result: ' + result);
    });
  }

  createTable() {
    //
  }

  joinRoom(roomNum) {
    this.tableService.tableNum = roomNum;
    this.wss.emit('joinTable', {room: roomNum});
  }

  ngOnInit() {
    if (this.wss.start) {
    } else {
       this.router.navigate(['/']).then((r) => {
       });
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  logStuff(stuff: any) {
    if (!environment.production) {
      console.log(stuff);
    }
  }

  ngOnDestroy(): void {
    //
  }

  ngAfterViewInit(): void {
    this.wss.emit('getTables', {});
  }

}
