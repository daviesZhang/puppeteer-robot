import {concat, concatMap, Observable, of} from "rxjs";
import {Context, StepAction, StepHandler, StepInterceptor} from "./step-action";
import {Step} from "./step";


/**
 * 用例
 */
export class ScriptCase {
  name: string;
  steps: Step[];
  options?: Record<string, unknown>;


  constructor(name: string, steps: Step[]) {
    this.name = name;
    this.steps = steps;
  }
}



export class InterceptorHandler implements StepHandler {
  next: StepHandler;
  interceptor: StepInterceptor;

  constructor(next: StepHandler, interceptor: StepInterceptor) {
    this.next = next;
    this.interceptor = interceptor;
  }

  handle(step: Step, context: Context) {
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

  handle(step: Step, context: Context) {
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

  handle(step: Step, context: Context): Observable<unknown> {
    return of(true).pipe(concatMap(() => this.action.run(step, context)))
  }
}

/**
 * 运行器
 */
export class Run {

  context: Context;
  scriptCase: ScriptCase;


  constructor(context: Context, scriptCase: ScriptCase) {
    this.context = context;
    this.scriptCase = scriptCase;
  }


  run(): Observable<unknown> {
    const steps = this.scriptCase.steps;
    const context = this.context;
    const actions = context.actions;

    const actions$ = [];
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



