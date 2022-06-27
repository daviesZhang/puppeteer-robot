import {concat, concatMap, Observable, of} from "rxjs";
import {DefaultContext} from "./step-action";
import {ActionResult, ScriptCase, Step, StepAction, StepHandler, StepInterceptor} from "@robot/robot-api";


export class InterceptorHandler implements StepHandler {
  next: StepHandler;
  interceptor: StepInterceptor;

  constructor(next: StepHandler, interceptor: StepInterceptor) {
    this.next = next;
    this.interceptor = interceptor;
  }

  handle(step: Step, context: DefaultContext) {
    return this.interceptor.intercept(step, context, this.next);
  }
}

export class InterceptingHandler implements StepHandler {
  interceptors: StepInterceptor[];

  backend: StepHandler;

  constructor(backend: StepHandler, interceptors: StepInterceptor[]) {
    this.backend = backend;
    this.interceptors = interceptors;
  }

  handle(step: Step, context: DefaultContext) {
    const chain = this.interceptors
      .reduceRight((next, interceptor) => new InterceptorHandler(next, interceptor),
        this.backend);
    return chain.handle(step, context);
  }
}


class BackendStepHandler implements StepHandler {
  action: StepAction<Step>;

  constructor(action: StepAction<Step>) {
    this.action = action;
  }

  paramsReplace(value: string, params: Map<string, unknown>): string {
    const regx = new RegExp("(?<!\\$)(\\$\\{(\\w+)})", "g");
    let rest = regx.exec(value);
    let newString = value;
    while (rest != null) {
      const [str, , key] = rest;
      const newValue: string = (params.get(key) || '') as string;
      newString = newString.replace(str, newValue);
      rest = regx.exec(value);
    }
    return newString;
  }

  handle(step: Step, context: DefaultContext): Observable<ActionResult<Step>> {
    return of(true).pipe(concatMap(() => {
      Object.keys(step).forEach(key => {
        const value = step[key];
        if (typeof value === 'string') {
          step[key] = this.paramsReplace(value, context.runParams);
        }
      });
      const options = step.options;
      if (options) {
        Object.keys(options).forEach(key => {
          const value = options[key];
          if (typeof value === 'string') {
            options[key] = this.paramsReplace(value, context.runParams);
          }
        });
      }
      return this.action.run(step, context);}))
  }
}

/**
 * 运行器
 */
export class Run {

  context: DefaultContext;
  scriptCase: ScriptCase;


  constructor(context: DefaultContext, scriptCase: ScriptCase) {
    this.context = context;
    this.scriptCase = scriptCase;
  }


  run(): Observable<ActionResult<Step>> {
    const steps = this.scriptCase.steps;
    const context = this.context;
    const actions = context.actions;
    const actions$: Observable<ActionResult<Step>>[] = [];
    for (const step of steps) {

      const action = actions.find(action => action.support(step));
      const result$ = new InterceptingHandler(
        new BackendStepHandler(action),
        context.stepInterceptor || []
      ).handle(step, context);
      actions$.push(result$);
    }
    return concat(...actions$);
  }


}



