import { chatWidget, initFromScript, optionsFromDataset, type ChatWidget } from './index';

const global = chatWidget as typeof chatWidget & { init: typeof initFromScript };
global.init = initFromScript;

(window as unknown as { AiKitChat: typeof global }).AiKitChat = global;

const page = window as unknown as { aiKitChat?: ChatWidget };
const script = document.currentScript as HTMLScriptElement | null;
if (script?.dataset.url || script?.dataset.configUrl || script?.dataset.appId) {
  if (page.aiKitChat) {
    page.aiKitChat.setOptions(optionsFromDataset({ ...script.dataset }));
  } else {
    const widget = initFromScript(script);
    if (widget) {
      page.aiKitChat = widget;
    }
  }
}

export default global;
