import {Observable} from "rxjs";

import {ActionResult, IScriptCase, ScriptCase, Step, StepInterceptor} from "@robot/robot-api";


export interface IElectronAPI {
  getAppVersion: () => string,
  fs: () => fs,
  path: () => path,
  puppeteer: () => Promise<any>,
  run: (scriptCase: IScriptCase, interceptors?: StepInterceptor[]
        ,handle?:(result:ActionResult<Step>)=>void) => Promise<Promise<ActionResult<Step>[]>>,
}

declare global {
  interface Window {
    electron: IElectronAPI
  }
}
