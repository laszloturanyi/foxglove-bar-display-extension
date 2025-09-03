import { ExtensionContext } from "@foxglove/studio";
import { initBarDisplay } from "./BarDisplay";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "Bar Display", initPanel: initBarDisplay });
}
