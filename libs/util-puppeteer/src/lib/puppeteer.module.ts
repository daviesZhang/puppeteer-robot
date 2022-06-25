import {Module} from "@nestjs/common";
import {
  CloseBrowserAction,
  DefaultContext,
  InputTextAction,
  OpenBrowserAction,
  OpenPageAction,
  PutParamsAction
} from "./step-action";


@Module({

  providers: [OpenBrowserAction,
    CloseBrowserAction,OpenPageAction,PutParamsAction,InputTextAction,DefaultContext],
})
export class PuppeteerModule {

}
