import {
  concat,
  concatMap,
  exhaustMap,
  interval,
  mergeMap,
  Observable,
  of,
  pluck,
  share,
  switchMap,
  takeWhile
} from "rxjs";
import {DefaultContext} from "./step-action";
import {ActionResult, ScriptCase, Step, StepAction, StepHandler, StepInterceptor, StepType} from "@robot/robot-api";


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

  handle(step: Step, context: DefaultContext): Observable<ActionResult<Step>> {
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
      const newValue: string = String(params.get(key)) as string;
      console.log(str, newValue);
      newString = newString.replace(str, newValue);
      rest = regx.exec(value);
    }
    return newString;
  }

  handle(step: Step, context: DefaultContext): Observable<ActionResult<Step>> {

    return of(true).pipe(mergeMap(() => {
      const copyStep = JSON.parse(JSON.stringify(step));
      Object.keys(step).forEach(key => {
        const value = step[key];
        if (typeof value === 'string') {
          copyStep[key] = this.paramsReplace(value, context.runParams);
        }
      });
      const options = copyStep.options;
      if (options) {
        Object.keys(options).forEach(key => {
          const value = options[key];
          if (typeof value === 'string') {
            options[key] = this.paramsReplace(value, context.runParams);
          }
        });
      }
      return this.action.run(copyStep, context);
    }))
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
    const actions$: Observable<ActionResult<Step>>[] = [];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.type === StepType.STRUCT_IF) {
        const result = this.ifStep(i, steps);
        i = result.index;
        actions$.push(result.next);
      } else if (step.type == StepType.STRUCT_WHILE) {
        const result = this.whileStep(i, steps);
        i = result.index;
        actions$.push(result.next);
      } else {
        actions$.push(this.runAction(step));
      }
    }

    return concat(...actions$);
  }

  runAction(...steps: Step[]): Observable<ActionResult<Step>> {
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


  ifStep(index: number, steps: Step[]): {
    next: Observable<ActionResult<Step>>,
    index: number
  } {
    const success: Observable<ActionResult<Step>>[] = [];
    const fail: Observable<ActionResult<Step>>[] = [];
    let next = false;
    const ifAction = this.runAction(steps[index]);
    index++;
    for (; index < steps.length; index++) {
      const step = steps[index];
      if (step.type === StepType.STRUCT_ENDIF) {
        break;
      }
      if (step.type === StepType.STRUCT_ELSE) {
        next = true;
      }
      const action = this.getAction(step, index, steps);
      index = action.index;
      next ? fail.push(action.action$) : success.push(action.action$);
    }
    const next$ = ifAction.pipe(switchMap(result => {
      if (result.data) {
        return concat(...success);
      } else {
        return concat(...fail);
      }
    }));
    return {next: next$, index}
  }


  whileStep(index: number, steps: Step[]): {
    next: Observable<ActionResult<Step>>,
    index: number
  } {
    const actions: Observable<ActionResult<Step>>[] = [];
    const while$ = this.runAction(steps[index]);
    index++;
    for (; index < steps.length; index++) {
      const step = steps[index];
      if (step.type === StepType.STRUCT_ENDWHILE) {
        break;
      }
      const action = this.getAction(step, index, steps);
      index = action.index;
      actions.push(action.action$);
    }
    const next$ = concat(...actions);
    const next = interval(0).pipe(exhaustMap(() => {
      return while$.pipe(switchMap(data => {
        return data.data ? next$ : of(data);
      }))
    }), takeWhile(next => next.step.type !== StepType.STRUCT_WHILE));
    return {next, index}
  }

  private getAction(step: Step, index: number, steps: Step[]) {
    let action$: Observable<ActionResult<Step>>;
    if (step.type === StepType.STRUCT_IF) {
      const result = this.ifStep(index, steps);
      index = result.index;
      action$ = result.next;
    } else if (step.type === StepType.STRUCT_WHILE) {
      const result = this.whileStep(index, steps);
      index = result.index;
      action$ = result.next;
    } else {
      action$ = this.runAction(step);
    }
    return {action$, index};
  }
}



