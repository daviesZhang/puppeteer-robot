import {Module} from "@nestjs/common";
import {
  CloseBrowserAction,
  DefaultContext,
  InputTextAction,
  OpenBrowserAction,
  OpenPageAction,
  PutParamsAction,
  StructElseAction,
  StructEndIfAction,
  StructEndwhileAction,
  StructIfAction,
  StructWhileAction,
  WaitAction
} from "./step-action";


@Module({

  providers: [OpenBrowserAction,
    StructElseAction,
    StructIfAction,
    StructWhileAction,
    StructEndwhileAction,WaitAction,
    StructEndIfAction,
    CloseBrowserAction, OpenPageAction, PutParamsAction, InputTextAction, DefaultContext],
})
export class PuppeteerModule {

}
