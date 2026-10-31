import { vt as extensions } from "./CanvasPool-CKBgjVg_.js";
import { u as Container } from "./Filter-CteG7TAT.js";
import { c as DOMPipe, l as accessibilityTarget, n as EventSystem, t as FederatedContainer, u as AccessibilitySystem } from "./FederatedEventTarget-jrCASupg.js";
import "./FilterSystem-t4Sygkln.js";
import "./init-B7oVPbZZ.js";
// node_modules/pixi.js/lib/accessibility/init.mjs
extensions.add(AccessibilitySystem);
extensions.mixin(Container, accessibilityTarget);
// node_modules/pixi.js/lib/dom/init.mjs
extensions.add(DOMPipe);
// node_modules/pixi.js/lib/events/init.mjs
extensions.add(EventSystem);
extensions.mixin(Container, FederatedContainer);
