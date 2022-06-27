import * as puppeteer from "puppeteer-core";
import {Browser, Page} from "puppeteer-core";
import {from, map, Observable, of, switchMap, tap, timer} from "rxjs";
import * as vm from "vm";
import {Injectable, Scope} from "@nestjs/common";
import {
  ActionResult,
  CloseBrowser,
  Context,
  InputText,
  OpenBrowser,
  OpenPage,
  PutParams,
  Step,
  StepAction,
  StepInterceptor,
  StepType,
  StructElse,
  StructEndIf,
  StructEndwhile,
  StructIf,
  StructWhile,
  Wait
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
    const append = step.append;
    if (append) {
      return from(context.page.type(selector, step.text, step.options))
        .pipe(map(next => resultSuccess(begin, step)));
    }
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
    const {selector, value, key, text, expression} = step;

    if (!selector) {
      let _value = value;
      if (expression) {
        _value = vm.runInNewContext(value);
      }
      context.runParams.set(key,_value);

      return of(resultSuccess(begin, step, _value));
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


@Injectable()
export class StructIfAction implements StepAction<StructIf> {
  run(step: StructIf, context: DefaultContext): Observable<ActionResult<StructIf>> {
    const begin = new Date().getTime();
    const success = !!vm.runInNewContext(step.expression, {});
    return of(resultSuccess(begin, step, success));
  }

  support(step: StructIf): boolean {
    return step.type === StepType.STRUCT_IF;
  }
}

@Injectable()
export class StructElseAction implements StepAction<StructElse> {
  run(step: StructElse, context: DefaultContext): Observable<ActionResult<StructElse>> {
    const begin = new Date().getTime();
    return of(resultSuccess(begin, step));
  }

  support(step: StructIf): boolean {
    return step.type === StepType.STRUCT_ELSE;
  }
}

@Injectable()
export class StructEndIfAction implements StepAction<StructEndIf> {
  run(step: StructEndIf, context: DefaultContext): Observable<ActionResult<StructEndIf>> {
    const begin = new Date().getTime();
    return of(resultSuccess(begin, step));
  }

  support(step: StructIf): boolean {
    return step.type === StepType.STRUCT_ENDIF;
  }
}


@Injectable()
export class StructWhileAction implements StepAction<StructWhile> {
  run(step: StructWhile, context: DefaultContext): Observable<ActionResult<StructWhile>> {
    const begin = new Date().getTime();

    const success = !!vm.runInNewContext(step.expression, {});
    return of(resultSuccess(begin, step, success));
  }

  support(step: StructIf): boolean {
    return step.type === StepType.STRUCT_WHILE;
  }
}

@Injectable()
export class StructEndwhileAction implements StepAction<StructEndwhile> {
  run(step: StructEndwhile, context: DefaultContext): Observable<ActionResult<StructEndwhile>> {
    const begin = new Date().getTime();
    return of(resultSuccess(begin, step));
  }

  support(step: StructIf): boolean {
    return step.type === StepType.STRUCT_ENDWHILE;
  }
}

@Injectable()
export class WaitAction implements StepAction<Wait> {
  run(step: Wait, context: DefaultContext): Observable<ActionResult<Wait>> {
    const begin = new Date().getTime();
    const selectorOrTimeout = step.selectorOrTimeout;
    if (typeof selectorOrTimeout === "string"&&context.page) {
      if (selectorOrTimeout.startsWith("//")) {
      // const options = (step.options || {}) as any;

        return from( context.page.waitForXPath(selectorOrTimeout))
          .pipe(map(() => resultSuccess(begin, step)));
      }else{
     //  const options = (step.options || {}) as any;
        return from(context.page.waitForSelector(selectorOrTimeout))
          .pipe(map(() => resultSuccess(begin, step)));
      }
    }else if (typeof selectorOrTimeout ==="number"){
      return timer(selectorOrTimeout).pipe(map(next => resultSuccess(begin, step)));
    }else{
      return of(resultSuccess(begin, step));
    }
  }
  support(step: Wait): boolean {
    return step.type === StepType.WAIT;
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

  browser!: Browser;

  page!: Page;

  [key: string]: unknown;

  private _actions: StepAction<Step>[] = [];

  constructor(private openBrowser: OpenBrowserAction,
              private openPage: OpenPageAction,
              private inputText: InputTextAction,
              private structEndif: StructEndIfAction,
              private structIf: StructIfAction,
              private waitAction: WaitAction,
              private structElse: StructElseAction,
              private structWhile: StructWhileAction,
              private structEndwhile: StructEndwhileAction,
              private putParams: PutParamsAction,
              private closeBrowser: CloseBrowserAction) {
    this._actions = [openBrowser,waitAction, openPage, putParams,
      structEndif,
      structIf,
      structWhile,
      structEndwhile,
      structElse, inputText, closeBrowser];

  }

  get actions(): StepAction<Step>[] {
    return this._actions;
  }

  set actions(steps: StepAction<Step>[]) {
    this._actions = steps;
  }
}
