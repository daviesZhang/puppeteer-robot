import {Controller, Get, InjectionToken, Type} from '@nestjs/common';

import {AppService} from './app.service';
import {
  Context, StepAction, StepInterceptor,
  CloseBrowser, InputText, OpenBrowser, OpenPage, Step, ScriptCase, StepHandler
} from "@robot/robot-api";
import {
  DefaultContext,

  puppeteerUtils,
  Run,


} from "@robot/util-puppeteer";
import {Observable, tap} from 'rxjs';

class LogInterceptor implements StepInterceptor {
  intercept(step: Step, context: Context, handler: StepHandler): Observable<unknown> {
    console.log(`准备执行${step.type}-${step.name}`);
    return handler.handle(step, context).pipe(tap(next=>{
      console.log("执行完成一个~");
    }));
  }

}

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


    context.stepInterceptor.push(new LogInterceptor());
    const run = new Run(context, testCase);
    return run.run();
  }


}
