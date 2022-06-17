import {BrowserConnectOptions, BrowserLaunchArgumentOptions, LaunchOptions, Product} from "puppeteer-core";

export enum StepType {

  OPEN_BROWSER,
  CLOSE_BROWSER,
  OPEN_PAGE,
  INPUT_TEXT,

}

/**
 * 步骤
 */
export interface Step {
  name: string;
  type: StepType;
  options?: unknown;
}


export class OpenBrowser implements Step {
  name: string;

  type: StepType;

  options?: LaunchOptions
    & BrowserLaunchArgumentOptions
    & BrowserConnectOptions
    & { product?: Product; extraPrefsFirefox?: Record<string, unknown>; };


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
  options: Record<string, unknown>;

  constructor(name: string, url: string) {
    this.name = name;
    this.url = url;
    this.type = StepType.OPEN_PAGE;
  }
}


