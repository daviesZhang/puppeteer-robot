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
  STRUCT_IF,
  STRUCT_ELSE,
  STRUCT_ENDIF,
  STRUCT_WHILE,
  STRUCT_ENDWHILE,
  WAIT


}

/**
 * 步骤
 */
export declare interface Step {
  name: string;
  type: StepType;
  options?: unknown;
}

export class Wait implements Step {
  name: string;
  type: StepType;
  selectorOrTimeout: string | number;
  options?: unknown;

  constructor(name: string, selectorOrTimeout: string | number) {
    this.name = name;
    this.selectorOrTimeout = selectorOrTimeout;
    this.type = StepType.WAIT;
  }
}

export class StructWhile implements Step {
  name: string;
  type: StepType;
  expression: string;

  constructor(name: string, expression: string) {
    this.name = name;
    this.expression = expression;
    this.type = StepType.STRUCT_WHILE;
  }
}


export class StructEndwhile implements Step {
  name: string;
  type: StepType;


  constructor(name: string) {
    this.name = name;
    this.type = StepType.STRUCT_ENDWHILE;
  }
}

export class StructIf implements Step {
  name: string;
  type: StepType;
  expression: string;

  constructor(name: string, expression: string) {
    this.name = name;
    this.expression = expression;
    this.type = StepType.STRUCT_IF;
  }
}

export class StructElse implements Step {
  name: string;
  type: StepType;


  constructor(name: string) {
    this.name = name;
    this.type = StepType.STRUCT_ELSE;
  }
}

export class StructEndIf implements Step {
  name: string;
  type: StepType;


  constructor(name: string) {
    this.name = name;
    this.type = StepType.STRUCT_ENDIF;
  }
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
  /**
   * 是否采用输入追加的方式
   */
  append = true;
  selector: string;
  options?: { delay: number };
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

export class PutParams implements Step {
  name: string;
  type: StepType;

  key: string;
  selector?: string;
  value?: string;
  //true从selector text中获取内容,false获取value
  text = false;

  expression = true;

  constructor(name: string, key: string, value?: string) {
    this.name = name;
    this.key = key;
    this.type = StepType.PUT_PARAMS;
    this.value = value;
  }


}


export interface Context {
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
  data?: unknown;

  [key: string]: unknown;
}

export interface StepAction<R extends Step> {

  run(step: R, context: Context): Observable<ActionResult<R>>;


  support(step: R): boolean;
}

export interface IScriptCase {
  name: string;
  steps: Step[];
  options?: Record<string, unknown>;
}

/**
 * 用例
 */
export class ScriptCase implements IScriptCase {
  name: string;
  steps: Step[];
  options?: Record<string, unknown>;


  constructor(name: string, steps: Step[]) {
    this.name = name;
    this.steps = steps;
  }
}
