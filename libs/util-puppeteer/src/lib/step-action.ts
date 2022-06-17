import * as puppeteer from "puppeteer-core";
import {Browser, Page} from "puppeteer-core";
import {from, map, Observable, switchMap, tap} from "rxjs";
import {CloseBrowser, InputText, OpenBrowser, OpenPage, Step, StepType} from "./step";
import {Injectable, Scope} from "@nestjs/common";

/**
 * 步骤拦截器
 */


export declare abstract class StepHandler {
  abstract handle(step: Step, context: Context): Observable<unknown>;
}

export interface StepInterceptor {
  intercept(step: Step, context: Context, handler: StepHandler): Observable<unknown>;
}


export interface StepAction<R extends Step> {

  run(step: R, context: Context): Observable<unknown>;


  support(step: R): boolean;
}

@Injectable()
export class OpenBrowserAction implements StepAction<OpenBrowser> {
  run(step: OpenBrowser, context: Context): Observable<unknown> {
    return from(puppeteer.launch({...step.options})).pipe(tap((browser: Browser) => {
      context.browser = browser;
    }))
  }

  support(step: OpenBrowser): boolean {
    return step.type === StepType.OPEN_BROWSER;
  }
}

@Injectable()
export class CloseBrowserAction implements StepAction<CloseBrowser> {


  run(step: CloseBrowser, context: Context): Observable<unknown> {

    return from(context.browser.close());
  }


  support(step: CloseBrowser): boolean {
    return step.type === StepType.CLOSE_BROWSER;
  }

}

@Injectable()
export class OpenPageAction implements StepAction<OpenPage> {
  run(step: OpenPage, context: Context): Observable<unknown> {

    return from(context.browser.newPage())
      .pipe(tap(page => context.page = page),
        switchMap(page => {
          return page.goto(step.url, step.options);
        }))
  }


  support(step: OpenBrowser): boolean {
    return step.type === StepType.OPEN_PAGE;
  }
}

@Injectable()
export class InputTextAction implements StepAction<InputText> {

  run(step: InputText, context: Context): Observable<unknown> {
    const selector = step.selector;
    return from(context.page.$eval(selector,
      (element, text: string) =>
        element.setAttribute("value", text),
      step.text))
      .pipe(map(() => true));
  }


  support(step: OpenBrowser): boolean {
    return step.type === StepType.INPUT_TEXT;
  }
}


/**
 * 执行上下文
 */
@Injectable({scope:Scope.TRANSIENT})
export class Context {


  stepInterceptor: StepInterceptor[] = [];

  options?: Record<string, unknown>;

  browser?: Browser;

  page?: Page;

  [key: string]: unknown;

  private _actions: StepAction<Step>[] = [];

  constructor(private openBrowser: OpenBrowserAction, private openPage: OpenPageAction,
              private inputText: InputTextAction, private closeBrowser: CloseBrowserAction) {
    this._actions = [openBrowser, openPage, inputText, closeBrowser];

  }

  get actions(): StepAction<Step>[] {
    return this._actions;
  }

  set actions(steps: StepAction<Step>[]) {
    this._actions = steps;
  }
}
