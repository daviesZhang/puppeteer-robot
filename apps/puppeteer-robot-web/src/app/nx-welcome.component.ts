import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {CloseBrowser, InputText, OpenBrowser, OpenPage, PutParams, ScriptCase} from "@robot/robot-api";


/* eslint-disable */

@Component({
  selector: 'puppeteer-robot-nx-welcome',
  template: `

    <div class="wrapper">
      <button (click)="run()" nz-button nzType="primary">run</button>
    </div>
  `,
  styles: [],
  encapsulation: ViewEncapsulation.None,
})
export class NxWelcomeComponent implements OnInit {
  constructor() {

  }

  ngOnInit(): void {


  }

  run() {
    const putParams = new PutParams("设置变量", "name");
    putParams.value = "1234";
    const openBrowser = new OpenBrowser("open_browser");
    const openPage = new OpenPage("open_page", "https://cn.bing.com/");
    const inputText = new InputText("input", "#sb_form_q", "test${name}x");
    const closeBrowser = new CloseBrowser("关掉${name}");


    openBrowser.options = {
      headless: false,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    };
    const testCase = new ScriptCase("test", [openBrowser, putParams, openPage, inputText,closeBrowser]);

    window.electron.run(testCase,
      [],
      next => console.log("一个", next)).then();
  }
}
