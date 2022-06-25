import {Module} from "@nestjs/common";
import {CloseBrowserAction, DefaultContext, InputTextAction, OpenBrowserAction, OpenPageAction} from "./step-action";


@Module({

  providers: [OpenBrowserAction,
    CloseBrowserAction,OpenPageAction,InputTextAction,DefaultContext],
})
export class PuppeteerModule {

}
