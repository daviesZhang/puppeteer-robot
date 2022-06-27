import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {
  CloseBrowser,
  InputText,
  OpenBrowser,
  OpenPage,
  PutParams,
  ScriptCase, StructElse,
  StructEndIf, StructEndwhile,
  StructIf, StructWhile, Wait
} from "@robot/robot-api";
import {WaitAction} from "@robot/util-puppeteer";


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
    const structIf = new StructIf("if", "${name}===1234");
    const successIf = new InputText("input", "#sb_form_q", "成功~");
    const structElse = new StructElse("else");
    const structEndif = new StructEndIf("endIf");

    const closeBrowser = new CloseBrowser("关掉${name}");


    openBrowser.options = {
      headless: false,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    };
    const inputNumber = new InputText("input", "#sb_form_q", "${count}");
    inputNumber.append = false;

    const testCase = new ScriptCase("test", [openBrowser,
      putParams,
      openPage,
      structIf,
      successIf,
      new StructIf("在IF", "321!==321"),
      new InputText("input", "#sb_form_q", "在IF=成功"),
      new StructElse("else"),
      new InputText("input", "#sb_form_q", "在IF=失败~"),
      structEndif,
      structElse,
      inputText,
      structEndif,
      new PutParams("设置变量", "count", "0"),
      new StructWhile("循环执行", "${count}<7"),
      new InputText("input", "#sb_form_q", "${count}"),
      new PutParams("设置变量", "count", "1+${count}"),
      new Wait("等三秒",3000),
      new StructEndwhile("结束循环"),
      new InputText("input", "#sb_form_q", "结束循环"),
    ]);

    window.electron.run(testCase,
      []
      ).then();
  }
}
