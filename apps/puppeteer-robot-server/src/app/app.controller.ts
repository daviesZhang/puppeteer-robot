import {Controller, Get} from '@nestjs/common';

import {AppService} from './app.service';
import {CloseBrowser, InputText, OpenBrowser, OpenPage, ScriptCase} from "@robot/robot-api";
import {DefaultContext, puppeteerUtils, Run,} from "@robot/util-puppeteer";


@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
  }

  @Get()
  async getData() {

    const openBrowser = new OpenBrowser("open_browser");
    const openPage = new OpenPage("open_page", "https://cn.bing.com/");
    const inputText = new InputText("input", "#sb_form_q", "test");
    const closeBrowser = new CloseBrowser("关掉");


    openBrowser.options = {
      headless: false,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    };
    const testCase = new ScriptCase("test", [openBrowser, openPage, inputText, closeBrowser]);
    const puppeteer = await puppeteerUtils();

    const context =await puppeteer.resolve(DefaultContext);


 //   context.stepInterceptor.push(new LogInterceptor());
    const run = new Run(context, testCase);
    return run.run();
  }


}
