import {Observable} from "rxjs";

/**
 * 步骤类型
 */
export enum StepType {

  OPEN_BROWSER,
  CLOSE_BROWSER,
  OPEN_PAGE,
  INPUT_TEXT,
  CLICK_ELEMENT,
  CLICK_LINK,
  PUT_PARAMS,


}

/**
 * 步骤
 */
export declare interface Step {
  name: string;
  type: StepType;
  options?: unknown;
}


export class OpenBrowser implements Step {
  name: string;

  type: StepType;

  options?: Record<string, unknown>;


  constructor(name: string) {
    this.name = name;
    this.type = StepType.OPEN_BROWSER;
  }
}


export class CloseBrowser implements Step {
  name: string;
  type: StepType;


  constructor(name: string) {
    this.name = name;
    this.type = StepType.CLOSE_BROWSER;

  }
}

export class InputText implements Step {
  name: string;
  type: StepType;

  selector: string;

  text: string;


  constructor(name: string, selector: string, text: string) {
    this.name = name;
    this.selector = selector;
    this.text = text;
    this.type = StepType.INPUT_TEXT;
  }
}

export class OpenPage implements Step {
  name: string;
  type: StepType;
  url: string;
  options?: Record<string, unknown>;

  constructor(name: string, url: string) {
    this.name = name;
    this.url = url;
    this.type = StepType.OPEN_PAGE;
  }
}

export class PutParams implements Step{
  name: string;
  type: StepType;
  //true从selector text中获取内容,false获取value
  text = false;
  key: string;
  selector?: string;
  value?: string;

  constructor(name: string,key:string) {
    this.name = name;
    this.key = key;
    this.type = StepType.PUT_PARAMS;
  }
}



export  interface Context {
  stepInterceptor: StepInterceptor[];

  options?: Record<string, unknown>;

  runParams: Map<string, unknown>;

  [key: string]: unknown;

  actions: StepAction<Step>[];
}


export declare abstract class StepHandler {
  abstract handle(step: Step, context: Context): Observable<ActionResult<Step>>;
}

export interface StepInterceptor {
  intercept(step: Step, context: Context, handler: StepHandler): Observable<ActionResult<Step>>;
}

export interface ActionResult<R> {
  success: boolean;
  begin: number;
  end: number;
  step: R;
  [key: string]: unknown;
}

export interface StepAction<R extends Step> {

  run(step: R, context: Context): Observable<ActionResult<R>>;


  support(step: R): boolean;
}

export interface IScriptCase{
  name: string;
  steps: Step[];
  options?: Record<string, unknown>;
}
/**
 * 用例
 */
export class ScriptCase implements IScriptCase{
  name: string;
  steps: Step[];
  options?: Record<string, unknown>;


  constructor(name: string, steps: Step[]) {
    this.name = name;
    this.steps = steps;
  }
}
