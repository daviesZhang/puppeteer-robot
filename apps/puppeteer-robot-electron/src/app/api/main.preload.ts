import {contextBridge, ipcRenderer,app,webContents} from 'electron';
import * as fs from "fs";
import {DefaultContext, puppeteerUtils, Run} from "@robot/util-puppeteer";
import {flatMap, from, lastValueFrom, mergeMap, Observable, switchMap, tap, zipWith} from 'rxjs';
import {StepInterceptor, ScriptCase, ActionResult, Step} from '@robot/robot-api';
import * as path from "path";
import {zip} from "rxjs/operators";





contextBridge.exposeInMainWorld('electron', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform,
  fs: () => fs,
  path: () => path,
  puppeteer: async () => puppeteerUtils(),
  run: (scriptCase: ScriptCase, interceptors: StepInterceptor[] = [],
        handle?:(result:ActionResult<Step>)=>void): Promise<ActionResult<Step>[]> => {
    return lastValueFrom(from(puppeteerUtils()).pipe(
      switchMap(utils => {
        return utils.resolve(DefaultContext);
      }),
      switchMap(context => {
        context.stepInterceptor.push(...interceptors);
        const run = new Run(context, scriptCase);
        return run.run().pipe(tap(next=>handle&&handle(next)),zipWith());
      })
    ));

  }
});
