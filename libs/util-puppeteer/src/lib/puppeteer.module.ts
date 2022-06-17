import {Module} from "@nestjs/common";
import {CloseBrowserAction, Context, InputTextAction, OpenBrowserAction, OpenPageAction} from "./step-action";


@Module({

  providers: [OpenBrowserAction,
    CloseBrowserAction,OpenPageAction,InputTextAction,Context],
})
export class PuppeteerModule {



}
