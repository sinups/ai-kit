import { DocCodeBlock } from "@/app/components/doc-code-block";
import { DocPageShell } from "@/app/components/doc-page-shell";
import {
  Bullets,
  C,
  DocTable,
  GuideHeader,
  GuideSection,
  P,
} from "@/app/components/doc-guide";
import { WidgetBuilder } from "@/app/components/widget-builder";
import { getDocNav } from "@/app/utils/doc-nav";

const TAG_INLINE = `<script src="https://cdn.jsdelivr.net/npm/@sinups/ai-kit/dist/embed/widget.js" defer
  data-url="https://chat.example.com/widget"
  data-title="Assistant"
  data-color="#0a84ff"
  data-size="medium"
  data-position="bottom-right"
  data-offset="30"
  data-pulse="true"
  data-open-after="15000"
  data-devices="all"
  data-actions='[
    {"id":"chat","label":"Chat with us","opensChat":true},
    {"id":"call","label":"Call me back","href":"tel:+10000000"},
    {"id":"telegram","label":"Telegram","href":"https://t.me/example","color":"#2aabee"}
  ]'></script>`;

const TAG_CALL = `<script src="https://cdn.jsdelivr.net/npm/@sinups/ai-kit/dist/embed/widget.js" defer></script>
<script>
  window.addEventListener("load", () => {
    window.chat = AiKitChat({
      url: "https://chat.example.com/widget",
      title: "Assistant",
      color: "#0a84ff",
      location: ["bottom", "right"],
      pulse: true,
      openAfter: 15000,
      labels: { open: "Открыть чат", actions: "Как с нами связаться" },
      actions: [
        { id: "chat", label: "Чат с ассистентом", opensChat: true },
        { id: "call", label: "Перезвоним за 10 секунд", href: "tel:+10000000" },
      ],
    });
  });
</script>`;

const TAG_REMOTE = `<script src="https://cdn.jsdelivr.net/npm/@sinups/ai-kit/dist/embed/widget.js" defer
  data-url="https://chat.example.com/widget"
  data-config-url="https://cdn.example.com/widget.json"></script>`;

const CODE = `import { chatWidget } from "@sinups/ai-kit/embed";

const widget = chatWidget({
  url: "https://chat.example.com/widget",
  position: "bottom-right",
  color: "rgb(10, 132, 255)",
  openAfter: 15000,
  actions: [
    { id: "chat", label: "Chat with us", opensChat: true },
    { id: "call", label: "Call me back", href: "tel:+10000000" },
  ],
});

widget.notify({
  title: "Need a hand?",
  text: "We answer in a minute and keep the thread in your inbox",
  avatar: "https://example.com/ada.png",
  timeout: false,
});`;

const NOTIFY = `// short form
widget.notify("Hi! Need a hand with the order?");

// full form: title, avatar, its own lifetime
widget.notify({
  title: "Anna from support",
  text: "Delivery across the EU takes 3 to 5 working days. Shall I cover returns?",
  avatar: "https://example.com/anna.png",
  timeout: 15000,        // ms; false keeps it until it is dismissed
});

// the call returns the hide of that one bubble
const { hide } = widget.notify({ text: "Stays until you say so", timeout: false });
setTimeout(hide, 3000);`;

const RECIPES = `const chat = window.aiKitChat;

// a greeting after the visitor has read for a while
setTimeout(() => chat.notify({ title: "Anna from support", text: "Anything I can help with?" }), 20000);

// a hint when the visitor is about to leave
document.addEventListener("mouseleave", (event) => {
  if (event.clientY <= 0) {
    chat.notify({ text: "Leaving? I can send the quote by email", id: "exit", timeout: false });
  }
}, { once: true });

// after the visitor scrolled through the pricing
const pricing = document.querySelector("#pricing");
new IntersectionObserver(([entry], observer) => {
  if (entry.isIntersecting) {
    chat.notify({ text: "Compare the plans with me?", id: "pricing" });
    observer.disconnect();
  }
}).observe(pricing);

// own button on the page instead of the launcher
document.querySelector("#ask").addEventListener("click", () => chat.open());

// a question about the current page
document.querySelector("#ask-about-order").addEventListener("click", () => {
  chat.navigate("https://chat.example.com/widget?order=A-1024");
});

// count of unanswered replies, kept by the page
chat.unread(3);
chat.on("open", () => chat.unread(0));

// what the visitor picked in the fan
chat.on("action", (id) => analytics.track("widget_action", { id }));

// quieter on a landing page, louder in the account
chat.setOptions({ pulse: false, openAfter: 0 });
chat.options.color = "#0a84ff";

// take it off a page where it does not belong
if (location.pathname.startsWith("/checkout")) {
  chat.hide();
}`;

const MESSAGES = `// inside the chat page, in the iframe
const host = "https://shop.example.com";  // the page the widget runs on
parent.postMessage({ source: "ai-kit-chat", type: "unread", count: 3 }, host);
parent.postMessage({ source: "ai-kit-chat", type: "notify", title: "New reply", text: "Your ticket is answered" }, host);
parent.postMessage({ source: "ai-kit-chat", type: "close" }, host);

// on the page around it
widget.on("action", (id) => analytics.track("widget_action", { id }));
widget.send("locale", { locale: "ru" });`;

export default function WidgetPage() {
  const { previousHref, nextHref } = getDocNav("/docs/widget");

  return (
    <DocPageShell
      sections={[
        { id: "builder", label: "Builder" },
        { id: "install", label: "Install" },
        { id: "options", label: "Options" },
        { id: "notifications", label: "Notifications" },
        { id: "control", label: "Control from the page" },
        { id: "messages", label: "Messages with the chat" },
      ]}
    >
      <GuideHeader
        title="Widget builder"
        description="A single script for any site: a round button, a fan of actions, notifications and the chat in a panel."
        previousHref={previousHref}
        nextHref={nextHref}
      >
        <P>
          The embed build carries no React and no dependencies: under 10 KB gzip, its own shadow root,
          and the chat itself opens in an iframe on the address you give it. Pick the options below,
          copy the snippet and paste it before <C>&lt;/body&gt;</C>.
        </P>
      </GuideHeader>

      <GuideSection id="builder" title="Builder">
        <WidgetBuilder />
      </GuideSection>

      <GuideSection id="install" title="Install">
        <P>
          Everything can be written straight into the tag: a <C>data-*</C> attribute per option,
          with <C>data-actions</C> and <C>data-labels</C> taking JSON. No JavaScript is needed.
        </P>
        <DocCodeBlock code={TAG_INLINE} language="html" />
        <P>
          The same thing as a call, when the page wants to keep the widget and drive it later.
          <C>AiKitChat</C> returns the widget; the auto-started one also lands on{' '}
          <C>window.aiKitChat</C>.
        </P>
        <DocCodeBlock code={TAG_CALL} language="html" />
        <P>
          A remote JSON is for those who want to change the settings without touching the page — an
          admin panel, for example. It is optional: <C>data-config-url</C> (or <C>data-app-id</C>{' '}
          with <C>data-config-endpoint</C>) is fetched and merged, and what the tag sets stays above
          it.
        </P>
        <DocCodeBlock code={TAG_REMOTE} language="html" />
        <P>
          In a bundler the same widget comes from <C>@sinups/ai-kit/embed</C>, with the full control
          surface in return.
        </P>
        <DocCodeBlock code={CODE} language="ts" />
      </GuideSection>

      <GuideSection id="options" title="Options">
        <DocTable
          columns={["Option", "Default", "Description"]}
          rows={[
            [<C key="o">url</C>, "none", "Address of the chat page shown in the panel."],
            [<C key="o">configUrl</C>, "none", "JSON with the same options, fetched and merged under the ones set here. appId with configEndpoint works the same way."],
            [<C key="o">position</C>, <C key="d">bottom-right</C>, "Corner: bottom-right, bottom-left, top-right, top-left."],
            [<C key="o">offset</C>, <C key="d">30</C>, "Distance from the edges in px, a number or { x, y }."],
            [<C key="o">location</C>, "none", "[vertical, horizontal] in one go: words pick the edge (top, bottom, left, right), numbers also set the distance, and a negative number counts from the opposite edge."],
            [<C key="o">color</C>, "blue", "Accent of the button and of the actions without their own color."],
            [<C key="o">size</C>, <C key="d">medium</C>, "small, medium, large or a diameter in px; the spacing of the fan follows it."],
            [<C key="o">icon</C>, <C key="d">chat</C>, "chat, circle, dots, send, inline SVG or an image URL."],
            [<C key="o">avatar</C> , "none", "Second face of the button, shown by iconAnimation."],
            [<C key="o">iconAnimation</C>, <C key="d">none</C>, "none, circle, coin, flip: how the icon and the avatar alternate while closed."],
            [<C key="o">pulse</C>, <C key="d">false</C>, "Slow rings around the closed button."],
            [<C key="o">openAfter</C>, <C key="d">0</C>, "Opens the panel after this many milliseconds."],
            [<C key="o">openAfterOnMobile</C>, <C key="d">false</C>, "Whether the timer also works on a narrow screen."],
            [<C key="o">remember</C>, <C key="d">true</C>, "Skips the timer once the visitor closed the widget."],
            [<C key="o">devices</C>, <C key="d">all</C>, "all, desktop or mobile."],
            [<C key="o">mobileHeight</C>, <C key="d">100</C>, "Height of the panel on a narrow screen, in percent."],
            [<C key="o">actions</C>, "none", "Up to nine buttons: id, label, icon, color, href or opensChat, unread."],
            [<C key="o">actionsMotion</C>, <C key="d">sequence</C>, "sequence sends them out one after another, together almost at once."],
            [<C key="o">notifications</C>, <C key="d">true</C>, "Shows the bubbles of notify."],
            [<C key="o">indicator</C>, <C key="d">true</C>, "Shows the unread count on the button."],
            [<C key="o">notificationTimeout</C>, <C key="d">12000</C>, "How long a bubble lives when the call does not say otherwise."],
            [<C key="o">notificationLimit</C>, <C key="d">3</C>, "How many bubbles stay on screen at once; the oldest leaves first."],
            [<C key="o">theme</C>, <C key="d">auto</C>, "light, dark or auto, which follows the visitor."],
            [<C key="o">iconColor</C>, "picked", "Color of the icon on the button; picked from the background when it is a hex."],
            [<C key="o">panelWidth</C>, <C key="d">380</C>, "Panel width in px, never wider than the viewport."],
            [<C key="o">panelHeight</C>, <C key="d">640</C>, "Panel height in px, never taller than the space above the button."],
            [<C key="o">actionSize</C>, "size", "Diameter of an action button; follows the button size until it is set."],
            [<C key="o">actionGap</C>, "size / 6", "Space between the action buttons."],
            [<C key="o">mobileBreakpoint</C>, <C key="d">520</C>, "Width below which the panel opens full screen."],
            [<C key="o">zIndex</C>, <C key="d">2147483000</C>, "Stacking order of the widget."],
            [<C key="o">labels</C>, "English", "Every string of the widget: open, close, actions, closeActions, panel, unread, dismissNotification."],
            [<C key="o">css</C>, "none", "CSS added inside the shadow root. Keep it out of a remote config you do not control."],
            [<C key="o">defer</C>, <C key="d">true</C>, "Loads the chat page on the first open."],
          ]}
        />
      </GuideSection>

      <GuideSection id="notifications" title="Notifications">
        <P>
          A bubble takes a string or an object with <C>title</C>, <C>content</C> (or <C>text</C>),{" "}
          <C>avatar</C> and <C>timeout</C>. Up to <C>notificationLimit</C> of them stay on screen,
          newest next to the button; each has its own timer and its own <C>hide</C>. A click on the
          bubble opens the chat, the cross closes that bubble, and an avatar that fails to load is
          dropped instead of showing a broken image.
        </P>
        <DocCodeBlock code={NOTIFY} language="ts" />
        <P>Ways pages use it, all built from the same few calls:</P>
        <DocCodeBlock code={RECIPES} language="ts" />
      </GuideSection>

      <GuideSection id="control" title="Control from the page">
        <Bullets>
          <li>
            <C>open</C>, <C>close</C>, <C>toggle</C> — the panel.
          </li>
          <li>
            <C>notify</C> — a bubble above the closed button with a title, an avatar and its own
            lifetime; <C>timeout: false</C> keeps it until it is dismissed, and the call returns{" "}
            <C>hide</C> for that one bubble. The text takes <C>**bold**</C>, <C>`code`</C> and{" "}
            <C>[links](https://example.com)</C>; everything else is escaped.
          </li>
          <li>
            <C>clearNotifications</C> — takes every bubble off the screen.
          </li>
          <li>
            <C>unread</C> — the count on the button, cleared when the chat opens.
          </li>
          <li>
            <C>setOptions</C> — new options at any time; the live <C>options</C> object takes a
            single field, as in <C>widget.options.color = &quot;#000&quot;</C>.
          </li>
          <li>
            <C>hide</C> and <C>show</C> — take the widget off the page and bring it back.
          </li>
          <li>
            <C>navigate</C> — open the panel on another address.
          </li>
          <li>
            <C>on</C> — events of the widget (<C>open</C>, <C>close</C>, <C>action</C>,{" "}
            <C>message</C>, <C>ready</C>); <C>send</C> — a message into the chat page.
          </li>
          <li>
            <C>destroy</C> — remove the widget with its listeners and timers.
          </li>
        </Bullets>
      </GuideSection>

      <GuideSection id="messages" title="Messages with the chat">
        <P>
          The page in the panel talks to the widget through <C>postMessage</C>. A message is taken
          only when it comes from the frame of the widget itself and from the origin of <C>url</C>,
          so neither another tab nor another frame of the same site can close the widget or push a
          notification into it. Send with the origin of the host page, not <C>&quot;*&quot;</C>.
        </P>
        <DocCodeBlock code={MESSAGES} language="ts" />
      </GuideSection>
    </DocPageShell>
  );
}
