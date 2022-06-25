import * as puppeteer from "puppeteer-core";
import {Browser, Page} from "puppeteer-core";
import {from, map, Observable, of, switchMap, tap} from "rxjs";

import {Injectable, Scope} from "@nestjs/common";
import {
  Context, StepAction, StepInterceptor,
  CloseBrowser, InputText, OpenBrowser, OpenPage, Step, StepType, ActionResult, PutParams
} from "@robot/robot-api";


function resultSuccess<R extends Step>(begin: number, step: R, data?: unknown): ActionResult<R> {
  return {success: true, begin, end: new Date().getTime(), step: step, data}
}

function resultError<R extends Step>(begin: number, step: R, message?: string): ActionResult<R> {
  return {success: true, begin, end: new Date().getTime(), step: step, message}
}

@Injectable()
export class OpenBrowserAction implements StepAction<OpenBrowser> {
  run(step: OpenBrowser, context: DefaultContext): Observable<ActionResult<OpenBrowser>> {
    const begin = new Date().getTime();
    return from(puppeteer.launch({...step.options})).pipe(tap((browser: Browser) => {
      context.browser = browser;
    }), map(() => resultSuccess(begin, step)))
  }

  support(step: OpenBrowser): boolean {
    return step.type === StepType.OPEN_BROWSER;
  }
}

@Injectable()
export class CloseBrowserAction implements StepAction<CloseBrowser> {


  run(step: CloseBrowser, context: DefaultContext): Observable<ActionResult<CloseBrowser>> {

    const begin = new Date().getTime();
    return from(context.browser.close()).pipe(map(() => resultSuccess(begin, step)));
  }


  support(step: CloseBrowser): boolean {
    return step.type === StepType.CLOSE_BROWSER;
  }

}

@Injectable()
export class OpenPageAction implements StepAction<OpenPage> {
  run(step: OpenPage, context: DefaultContext): Observable<ActionResult<OpenPage>> {
    const begin = new Date().getTime();
    return from(context.browser.newPage())
      .pipe(tap(page => context.page = page),
        switchMap(page => {
          return page.goto(step.url, step.options);
        }), map(() => resultSuccess(begin, step)))
  }


  support(step: OpenBrowser): boolean {
    return step.type === StepType.OPEN_PAGE;
  }
}

@Injectable()
export class InputTextAction implements StepAction<InputText> {

  run(step: InputText, context: DefaultContext): Observable<ActionResult<InputText>> {
    const begin = new Date().getTime();
    const selector = step.selector;
    return from(context.page.$eval(selector,
      (element, text: string) =>
        element.setAttribute("value", text),
      step.text))
      .pipe(map(next => resultSuccess(begin, step)));
  }


  support(step: OpenBrowser): boolean {
    return step.type === StepType.INPUT_TEXT;
  }
}


@Injectable()
export class PutParamsAction implements StepAction<PutParams> {
  run(step: PutParams, context: DefaultContext): Observable<ActionResult<PutParams>> {
    const begin = new Date().getTime();
    const {selector, value, key, text} = step;
    if (!selector) {
      context.runParams.set(key, value);
      return of(resultSuccess(begin, step));
    }
    return from(context.page.$eval<string>(
      selector, (el: HTMLInputElement) => text ? el.innerText : el.value))
      .pipe(tap(next => context.runParams.set(key, next)),
        map(next => resultSuccess(begin, step, next)));
  }
  support(step: OpenBrowser): boolean {
    return step.type === StepType.PUT_PARAMS;
  }
}

/**
 * 执行上下文
 */
@Injectable({scope: Scope.TRANSIENT})
export class DefaultContext implements Context {


  runParams = new Map<string, unknown>();

  stepInterceptor: StepInterceptor[] = [];

  options?: Record<string, unknown>;

  browser?: Browser;

  page?: Page;

  [key: string]: unknown;

  private _actions: StepAction<Step>[] = [];

  constructor(private openBrowser: OpenBrowserAction,
              private openPage: OpenPageAction,
              private inputText: InputTextAction,
              private closeBrowser: CloseBrowserAction) {
    this._actions = [openBrowser, openPage, inputText, closeBrowser];

  }

  get actions(): StepAction<Step>[] {
    return this._actions;
  }

  set actions(steps: StepAction<Step>[]) {
    this._actions = steps;
  }
}
