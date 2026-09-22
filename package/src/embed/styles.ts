export const WIDGET_STYLES = `
:host { all: initial; }
svg:not([stroke]) { fill: currentColor; }
* { box-sizing: border-box; }

.container {
  position: fixed;
  direction: ltr;
  z-index: var(--w-z);
  right: var(--w-x);
  bottom: var(--w-y);
  width: var(--w-size);
  height: var(--w-size);
  font-family: var(--w-font);
  color-scheme: var(--w-scheme);
}
.container[data-position^='top'] { top: var(--w-y); bottom: auto; }
.container[data-position$='left'] { left: var(--w-x); right: auto; }

.multi_button_wrap {
  position: absolute;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--w-size);
  height: var(--w-size);
}
[data-position^='top'] .multi_button_wrap { top: 0; bottom: auto; }
[data-position$='left'] .multi_button_wrap { left: 0; right: auto; }

.multi_button {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--w-size);
  height: var(--w-size);
  padding: 0;
  border: none;
  border-radius: 50%;
  background: none;
  perspective: 70px;
  cursor: pointer;
}
.multi_button:focus-visible { outline: 2px solid var(--w-color); outline-offset: 4px; }

.multi_button::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 0;
  display: block;
  width: var(--w-size);
  height: var(--w-size);
  border-radius: 50%;
  transform: translate3d(-50%, -50%, 0);
  box-shadow: 0 0 0 0 var(--w-ring), 0 0 0 0 var(--w-ring);
}
.container:not([data-opened]):not([data-actions-opened]):not([data-teaser]) .multi_button[data-pulse]::before {
  animation: shadow 8s ease-out infinite;
}
[data-opened] .multi_button::before,
[data-actions-opened] .multi_button::before {
  width: calc(var(--w-size) - 2 * var(--w-inset));
  height: calc(var(--w-size) - 2 * var(--w-inset));
  animation: shadowActive 0.5s ease-out forwards;
  transition: width 0.2s, height 0.2s;
}

.multi_button_icon {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--w-size);
  height: var(--w-size);
  border-radius: 50%;
  background: var(--w-color);
  color: var(--w-on-color);
  opacity: 1;
  transition: transform 0.2s 0.2s, opacity 0.2s 0.2s;
}
.multi_button_icon svg {
  position: relative;
  z-index: 2;
  display: block;
  width: calc(var(--w-size) * 0.46);
  height: calc(var(--w-size) * 0.46);
}
.multi_button_icon img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }

.multi_button_img {
  position: absolute;
  left: 0;
  top: 0;
  display: block;
  width: var(--w-size);
  height: var(--w-size);
  opacity: 0;
  transform: scale(1, 1);
  transition: transform 0.2s 0.2s, opacity 0.2s 0.2s;
}
.multi_button_img img { display: block; width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }

.animation_coin .multi_button_icon { animation: icon-animation-coin 9s ease-in 2s infinite; }
.animation_coin .multi_button_img { animation: img-animation-coin 9s ease-in 2s infinite; }
.animation_circle .multi_button_icon { animation: circle-animation 9s ease-in 2s infinite; }
.animation_circle .multi_button_icon svg { animation: icon-animation 9s ease-in 2s infinite; }
.animation_circle .multi_button_img { animation: image-animation 9s ease-in 2s infinite; }
.animation_flip .multi_button_icon { animation: flip-icon 7s ease-in-out 2s infinite; }
.animation_flip .multi_button_img { animation: flip-img 7s ease-in-out 2s infinite; }

[data-actions-opened] .multi_button_icon,
[data-actions-opened] .multi_button_img,
[data-opened] .multi_button_icon,
[data-opened] .multi_button_img {
  opacity: 0;
  transform: scale(0, 0);
  animation: none;
  transition: transform 0.2s, opacity 0.2s;
}

.multi_button_close {
  position: absolute;
  left: var(--w-inset);
  top: var(--w-inset);
  display: block;
  width: calc(var(--w-size) - 2 * var(--w-inset));
  height: calc(var(--w-size) - 2 * var(--w-inset));
  border-radius: 50%;
  background: var(--w-color);
  opacity: 0;
  transform: scale(0, 0);
  transition: transform 0.2s, opacity 0.2s;
}
[data-actions-opened] .multi_button_close,
[data-opened] .multi_button_close {
  opacity: 1;
  transform: scale(1, 1);
  transition: transform 0.2s 0.2s, opacity 0.2s 0.2s;
}
.multi_button_close::before,
.multi_button_close::after {
  content: '';
  position: absolute;
  left: calc(50% - var(--w-size) * 0.135);
  top: 50%;
  width: calc(var(--w-size) * 0.27);
  height: 1px;
  background: var(--w-on-color);
  transform: rotate(45deg);
}
.multi_button_close::after { transform: rotate(-45deg); }

.multi_button_noty {
  position: absolute;
  right: 0;
  top: 0;
  z-index: 3;
  width: 22px;
  height: 22px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #ff6363;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  line-height: 18px;
  text-align: center;
  visibility: visible;
  opacity: 1;
  transition: top 0.1s, opacity 0s 0.1s, visibility 0s 0.1s;
}
[data-actions-opened] .multi_button > .multi_button_noty,
[data-opened] .multi_button > .multi_button_noty {
  top: calc(-1 * var(--w-step));
  visibility: hidden;
  opacity: 0;
  transition: top 0.1s, opacity 0s 0s, visibility 0s 0s;
}

.multi_list {
  position: absolute;
  right: calc((var(--w-size) - var(--w-action-size)) / 2);
  bottom: 0;
  width: var(--w-action-size);
}
[data-position$='left'] .multi_list {
  left: calc((var(--w-size) - var(--w-action-size)) / 2);
  right: auto;
}
[data-position^='top'] .multi_list { top: 0; bottom: auto; }

.multi_button_item {
  position: absolute;
  right: 0;
  bottom: 0;
  width: var(--w-action-size);
  height: var(--w-action-size);
  opacity: 0;
  transition: bottom calc((var(--w-index) + 1) * 0.1s), opacity 0.4s;
}
[data-position$='left'] .multi_button_item { left: 0; right: auto; }
[data-position^='top'] .multi_button_item {
  top: 0;
  bottom: auto;
  transition: top calc((var(--w-index) + 1) * 0.1s), opacity 0.4s;
}

[data-actions-opened] .multi_button_item {
  bottom: calc((var(--w-index) + 1) * var(--w-step));
  opacity: 1;
}
[data-position^='top'][data-actions-opened] .multi_button_item {
  top: calc((var(--w-index) + 1) * var(--w-step));
  bottom: auto;
}
[data-motion='together'] .multi_button_item {
  transition:
    bottom calc((var(--w-count) - var(--w-index)) * 0.1s) calc((var(--w-count) - 1 - var(--w-index)) * 0.1s),
    opacity 0.4s calc(var(--w-count) * 0.1s);
}
[data-actions-opened] [data-motion='together'] .multi_button_item {
  transition:
    bottom calc((var(--w-index) + 1) * 0.1s) calc(var(--w-index) * 0.1s),
    opacity 0.4s;
}

.multi_button_item button,
.multi_button_item a {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 50%;
  background: var(--w-color);
  color: var(--w-on-color);
  cursor: pointer;
  text-decoration: none;
  transition: box-shadow 0.2s;
}
.multi_button_item button:hover,
.multi_button_item a:hover { box-shadow: 0 12px 24px rgb(0 0 0 / 20%); }
.multi_button_item button:focus-visible,
.multi_button_item a:focus-visible { outline: 2px solid var(--w-color); outline-offset: 4px; }
.multi_button_item .multi_button_noty {
  top: -2px;
  right: -2px;
  width: 22px;
  height: 22px;
}

.multi_button_item svg {
  display: block;
  width: calc(var(--w-action-size) * 0.4);
  height: calc(var(--w-action-size) * 0.4);
}
.multi_button_item img { width: 60%; height: 60%; border-radius: 50%; object-fit: cover; }

.multi_notification {
  position: absolute;
  right: 0;
  top: calc(50% - 15px);
  z-index: 0;
  padding: 8px 16px;
  border-radius: 15px;
  background: rgb(0 0 0 / 65%);
  color: #fff;
  font-size: 12px;
  line-height: 14px;
  letter-spacing: 0.2px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s, right 0.2s;
}
[data-position$='left'] .multi_notification { left: 0; right: auto; transition: opacity 0.2s, left 0.2s; }
[data-actions-opened] .multi_button_item button:hover + .multi_notification,
[data-actions-opened] .multi_button_item a:hover + .multi_notification,
[data-actions-opened] .multi_button_item button:focus-visible + .multi_notification,
[data-actions-opened] .multi_button_item a:focus-visible + .multi_notification {
  right: var(--w-step);
  opacity: 1;
}
[data-position$='left'][data-actions-opened] .multi_button_item button:hover + .multi_notification,
[data-position$='left'][data-actions-opened] .multi_button_item a:hover + .multi_notification {
  left: var(--w-step);
  right: auto;
}
[data-mode='full'] .multi_notification { display: none; }
[data-mode='full'][data-opened] .multi_button_wrap { display: none; }

.teasers {
  position: absolute;
  right: 0;
  bottom: calc(var(--w-size) + 12px);
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  width: max-content;
  max-width: min(340px, calc(100vw - 2 * var(--w-x)));
}
[data-position^='top'] .teasers {
  top: calc(var(--w-size) + 12px);
  bottom: auto;
  flex-direction: column;
}
[data-position$='left'] .teasers { left: 0; right: auto; }

.teaser {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 46px 18px 16px;
  border-radius: 18px;
  background: var(--w-surface);
  color: var(--w-fg);
  font-size: 15px;
  line-height: 1.45;
  text-align: start;
  cursor: pointer;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%), 0 18px 40px rgb(0 0 0 / 16%);
  opacity: 0;
  transform: translateX(var(--w-teaser-shift));
  transition: opacity 0.4s, transform 0.5s cubic-bezier(0, 0.8, 0.25, 1.18);
}
.teaser[data-shown] { opacity: 1; transform: translateX(0); }
.teaser[data-leaving] {
  opacity: 0;
  transform: translateX(calc(var(--w-teaser-shift) * 4));
  pointer-events: none;
  transition:
    opacity 0.3s,
    transform 0.4s ease-in,
    margin 0.3s ease-in;
}
.teaser_body { min-width: 0; padding-top: 2px; }
.teaser_title {
  margin-bottom: 4px;
  color: var(--w-muted);
  font-size: 13px;
  line-height: 1.3;
}
.teaser_avatar { margin-top: 2px; }
.teaser .text b { font-weight: 600; }
.teaser .text code {
  padding: 1px 5px;
  border-radius: 6px;
  background: color-mix(in srgb, CanvasText 8%, transparent);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
}
.teaser .text a { color: var(--w-color); text-decoration: none; }
.teaser .text a:hover { text-decoration: underline; }
.teaser_close {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: var(--w-close-bg);
  color: var(--w-muted);
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.15s;
}
.teaser:hover .teaser_close,
.teaser_close:focus-visible { opacity: 1; }
.teaser img { flex: none; width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.teaser button svg { width: 12px; height: 12px; }

.panel {
  position: absolute;
  right: 0;
  bottom: calc(var(--w-size) + 12px);
  display: flex;
  flex-direction: column;
  width: var(--w-panel-width);
  height: var(--w-panel-height);
  overflow: hidden;
  border-radius: 16px;
  background: var(--w-surface);
  color: var(--w-fg);
  box-shadow: 0 2px 6px rgb(0 0 0 / 8%), 0 16px 48px rgb(0 0 0 / 22%);
  opacity: 0;
  transform: scale(0.94);
  transform-origin: bottom right;
  visibility: hidden;
  transition: opacity 0.2s, transform 0.2s, visibility 0s linear 0.2s;
}
[data-position^='top'] .panel {
  top: calc(var(--w-size) + 12px);
  bottom: auto;
  transform-origin: top right;
}
[data-position$='left'] .panel { left: 0; right: auto; transform-origin: bottom left; }
[data-position='top-left'] .panel { transform-origin: top left; }
[data-opened] .panel { opacity: 1; transform: scale(1); visibility: visible; transition-delay: 0s; }
[data-mode='full'] .panel {
  position: fixed;
  inset: auto 0 0;
  width: auto;
  height: var(--w-mobile-height);
  border-radius: 16px 16px 0 0;
}
[data-mode='full'][data-position^='top'] .panel { inset: 0 0 auto; border-radius: 0 0 16px 16px; }

.header {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 8px 0 16px;
  font-size: 14px;
  font-weight: 600;
}
.header span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.header button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--w-muted);
  cursor: pointer;
}
.header button svg { width: 16px; height: 16px; }

.frameSlot { display: flex; flex: 1 1 auto; min-height: 0; }
.frame { flex: 1 1 auto; width: 100%; min-height: 0; border: none; background: var(--w-surface); }

.backdrop {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 35%);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0s linear 0.2s;
}
[data-mode='full'][data-opened] .backdrop { opacity: 1; visibility: visible; transition-delay: 0s; }

@keyframes shadow {
  0% { box-shadow: 0 0 0 0 transparent, 0 0 0 0 transparent; }
  10% { box-shadow: 0 0 0 0 var(--w-ring), 0 0 0 0 transparent; }
  12.5% { box-shadow: 0 0 0 8px var(--w-ring), 0 0 0 0 var(--w-ring); }
  15% { box-shadow: 0 0 0 16px var(--w-ring), 0 0 0 8px var(--w-ring); }
  17.5% { box-shadow: 0 0 0 24px transparent, 0 0 0 16px var(--w-ring); }
  20% { box-shadow: 0 0 0 24px transparent, 0 0 0 24px transparent; }
  100% { box-shadow: 0 0 0 24px transparent, 0 0 0 24px transparent; }
}
@keyframes shadowActive {
  0% { box-shadow: 0 0 0 0 var(--w-ring-soft), 0 0 0 0 transparent; }
  25% { box-shadow: 0 0 0 6px var(--w-ring-soft), 0 0 0 0 var(--w-ring-soft); }
  50% { box-shadow: 0 0 0 12px var(--w-ring-soft), 0 0 0 6px var(--w-ring-soft); }
  75% { box-shadow: 0 0 0 12px var(--w-ring-soft), 0 0 0 6px var(--w-ring-soft); }
  100% { box-shadow: 0 0 0 12px var(--w-ring-soft), 0 0 0 6px var(--w-ring-soft); }
}
@keyframes icon-animation-coin {
  0%, 2.667% { opacity: 1; }
  6.667%, 32% { opacity: 0; }
  36%, 100% { opacity: 1; }
}
@keyframes img-animation-coin {
  0%, 2.667% { opacity: 0; }
  6.667%, 32% { opacity: 1; }
  36%, 100% { opacity: 0; }
}
@keyframes circle-animation {
  0% { background: var(--w-color); }
  4%, 36% { background: var(--w-surface); }
  40%, 100% { background: var(--w-color); }
}
@keyframes icon-animation {
  0% { transform: scale(1); opacity: 1; }
  4%, 36% { transform: scale(1.7); opacity: 0; }
  40%, 100% { transform: scale(1); opacity: 1; }
}
@keyframes image-animation {
  0%, 6% { transform: scale(0.5); opacity: 0; }
  8%, 32% { transform: scale(1); opacity: 1; }
  34%, 100% { transform: scale(0.5); opacity: 0; }
}
@keyframes flip-icon {
  0%, 42.86% { transform: rotateY(0deg); opacity: 1; }
  50%, 92.86% { transform: rotateY(180deg); opacity: 0; }
  100% { transform: rotateY(0deg); opacity: 1; }
}
@keyframes flip-img {
  0%, 42.86% { transform: rotateY(180deg); opacity: 0; }
  50%, 92.86% { transform: rotateY(0deg); opacity: 1; }
  100% { transform: rotateY(180deg); opacity: 0; }
}

@media (pointer: coarse) { .multi_notification { display: none; } }

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
  }
}
`;
