import { chatWidget, optionsFromDataset } from './index';
import { MAX_ACTIONS, resolveOptions } from './options';
import { createChatWidget, type ChatWidget } from './widget';

const URL_ONE = 'https://chat.example.com/widget';

function shadow(): ShadowRoot {
  const host = document.querySelector('ai-kit-widget');
  if (!host?.shadowRoot) {
    throw new Error('the widget is not on the page');
  }
  return host.shadowRoot;
}

function button(): HTMLButtonElement {
  return shadow().querySelector('.multi_button') as HTMLButtonElement;
}

function widthIs(width: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
}

describe('embed/widget', () => {
  let widget: ChatWidget | undefined;

  beforeEach(() => {
    widthIs(1200);
    window.localStorage.clear();
  });

  afterEach(() => {
    widget?.destroy();
    widget = undefined;
    document.querySelectorAll('ai-kit-widget').forEach((node) => node.remove());
    jest.useRealTimers();
  });

  it('draws a closed button in a shadow root and opens the panel on click', () => {
    widget = createChatWidget({ url: URL_ONE, title: 'Assistant' });

    expect(button()).toHaveAttribute('aria-label', 'Open chat');
    expect(shadow().querySelector('iframe')).toBeNull();

    button().click();

    const frame = shadow().querySelector('iframe');
    expect(frame).toHaveAttribute('src', URL_ONE);
    expect(shadow().querySelector('.container')).toHaveAttribute('data-opened');
  });

  it('fans the actions out, reports the pick and opens the chat only when asked', () => {
    const picked: unknown[] = [];
    widget = createChatWidget({
      url: URL_ONE,
      actions: [
        { id: 'chat', label: 'Chat with us', opensChat: true },
        { id: 'call', label: 'Call me back' },
      ],
    });
    widget.on('action', (id) => picked.push(id));

    expect(button()).toHaveAttribute('aria-label', 'Show ways to get in touch');
    button().click();
    expect(shadow().querySelector('.container')).toHaveAttribute('data-actions-opened');

    shadow().querySelector<HTMLElement>('[data-action="call"]')?.click();
    expect(picked).toEqual(['call']);
    expect(shadow().querySelector('.container')).not.toHaveAttribute('data-opened');

    button().click();
    shadow().querySelector<HTMLElement>('[data-action="chat"]')?.click();
    expect(shadow().querySelector('.container')).toHaveAttribute('data-opened');
  });

  it('keeps at most six actions and drops a script link', () => {
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: `a${index}`,
      label: `Action ${index}`,
      href: index === 0 ? `${'java'}${'script'}:alert(1)` : 'https://example.com',
    }));
    const resolved = resolveOptions({ actions: many });

    expect(resolved.actions).toHaveLength(MAX_ACTIONS);
    expect(resolved.actions[0].href).toBeUndefined();
    expect(resolved.actions[1].href).toBe('https://example.com');
  });

  it('strips handlers from an icon that came with a remote config', () => {
    const resolved = resolveOptions({
      actions: [
        {
          id: 'x',
          label: 'X',
          icon: '<svg onload="alert(1)"><script>alert(2)</script><circle /></svg>',
        },
      ],
    });

    expect(resolved.actions[0].icon).not.toContain('onload');
    expect(resolved.actions[0].icon).not.toContain('<script');
  });

  it('opens on a timer, but not after the visitor closed it once', () => {
    jest.useFakeTimers();
    widget = createChatWidget({ url: URL_ONE, openAfter: 5000 });
    jest.advanceTimersByTime(5000);
    expect(shadow().querySelector('.container')).toHaveAttribute('data-opened');

    button().click();
    widget.destroy();
    document.querySelectorAll('ai-kit-widget').forEach((node) => node.remove());

    widget = createChatWidget({ url: URL_ONE, openAfter: 5000 });
    jest.advanceTimersByTime(5000);
    expect(shadow().querySelector('.container')).not.toHaveAttribute('data-opened');
  });

  it('keeps the timer away from a narrow screen unless it is allowed there', () => {
    jest.useFakeTimers();
    widthIs(400);
    widget = createChatWidget({ url: URL_ONE, openAfter: 3000 });
    jest.advanceTimersByTime(3000);
    expect(shadow().querySelector('.container')).not.toHaveAttribute('data-opened');
  });

  it('hides itself where the options say it should not be shown', () => {
    widget = createChatWidget({ url: URL_ONE, devices: 'mobile' });
    expect(shadow().querySelector<HTMLElement>('.container')?.hidden).toBe(true);
  });

  it('shows a bubble, counts it as unread and clears both when the panel opens', () => {
    widget = createChatWidget({ url: URL_ONE });
    widget.notify({ text: 'Need a hand with the pricing?', timeout: 0 });

    expect(shadow().querySelector('.teaser')?.textContent).toContain('Need a hand');
    expect(shadow().querySelector('.multi_button > .multi_button_noty')?.textContent).toBe('1');

    button().click();
    expect(shadow().querySelector('.teaser')).toHaveAttribute('data-leaving');
    expect(shadow().querySelector<HTMLElement>('.multi_button > .multi_button_noty')?.hidden).toBe(
      true
    );
  });

  it('shows the title, the avatar and the close of a notification', () => {
    widget = createChatWidget({ url: URL_ONE });
    widget.notify({
      title: 'Нужна помощь юриста?',
      text: 'Ответы придут по указанным контактам',
      avatar: 'https://example.com/a.png',
      timeout: false,
    });

    expect(shadow().querySelector('.teaser_title')?.textContent).toBe('Нужна помощь юриста?');
    expect(shadow().querySelector('.teaser_avatar')).toHaveAttribute(
      'src',
      'https://example.com/a.png'
    );
    expect(shadow().querySelector('.teaser')).toHaveAttribute('role', 'status');

    shadow().querySelector<HTMLElement>('.teaser_close')?.click();
    expect(shadow().querySelector('.teaser')).toHaveAttribute('data-leaving');
  });

  it('keeps the bubbles and the badge away when the options turn them off', () => {
    widget = createChatWidget({ url: URL_ONE, notifications: false, indicator: false });
    widget.notify({ text: 'Скрыто', timeout: false });
    widget.unread(5);

    expect(shadow().querySelector('.teaser')).toBeNull();
    expect(shadow().querySelector<HTMLElement>('.multi_button > .multi_button_noty')?.hidden).toBe(
      true
    );
  });

  it('stacks bubbles up to the limit and clears them all', () => {
    widget = createChatWidget({ url: URL_ONE, notificationLimit: 2 });
    widget.notify({ text: 'First', timeout: false });
    widget.notify({ text: 'Second', timeout: false });
    widget.notify({ text: 'Third', timeout: false });

    const texts = [...shadow().querySelectorAll('.teaser .text')].map((node) => node.textContent);
    expect(texts).toEqual(['Third', 'Second']);

    widget.clearNotifications();
    expect(shadow().querySelectorAll('.teaser[data-leaving]')).toHaveLength(2);
  });

  it('renders bold, code and links of a notification and escapes the rest', () => {
    widget = createChatWidget({ url: URL_ONE });
    widget.notify({
      text: 'Try **Team**, run `yarn add`, read [the docs](https://example.com/docs) <script>',
      timeout: false,
    });

    const text = shadow().querySelector('.teaser .text');
    expect(text?.querySelector('b')?.textContent).toBe('Team');
    expect(text?.querySelector('code')?.textContent).toBe('yarn add');
    const link = text?.querySelector('a');
    expect(link).toHaveAttribute('href', 'https://example.com/docs');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(text?.innerHTML).not.toContain('<script>');
  });

  it('takes the short form and the content name of the original API', () => {
    widget = createChatWidget({ url: URL_ONE });
    widget.notify('Привет! Нужна помощь с заказом?');
    expect(shadow().querySelector('.teaser .text')?.textContent).toBe(
      'Привет! Нужна помощь с заказом?'
    );

    widget.notify({ title: 'Анна, поддержка', content: 'Доставка 3–5 дней', timeout: false });
    expect(shadow().querySelector('.teaser .text')?.textContent).toBe('Доставка 3–5 дней');
    expect(shadow().querySelector('.teaser_title')?.textContent).toBe('Анна, поддержка');
  });

  it('drops an avatar that fails to load', () => {
    widget = createChatWidget({ url: URL_ONE });
    widget.notify({ text: 'Hi', avatar: 'https://example.com/missing.png', timeout: false });

    const avatar = shadow().querySelector<HTMLImageElement>('.teaser_avatar');
    expect(avatar).toBeInTheDocument();
    avatar?.dispatchEvent(new Event('error'));
    expect(shadow().querySelector('.teaser_avatar')).toBeNull();
  });

  it('keeps showing bubbles after the options change', () => {
    widget = createChatWidget({ url: URL_ONE });
    widget.notify({ text: 'Before', timeout: false });
    widget.setOptions({ color: 'rgb(0, 0, 0)' });
    widget.notify({ text: 'After', timeout: false });

    const texts = [...shadow().querySelectorAll('.teaser .text')].map((node) => node.textContent);
    expect(texts).toContain('After');
  });

  it('sanitises the icon of the widget itself and keeps a built-in name', () => {
    expect(resolveOptions({ icon: '<svg onload="alert(1)"><circle /></svg>' }).icon).not.toContain(
      'onload'
    );
    expect(
      resolveOptions({ icon: '<svg><img/onerror="alert(1)" src=x /></svg>' }).icon
    ).not.toContain('onerror');
    expect(resolveOptions({ icon: 'chat-icon' }).icon).toBe('chat');
    expect(resolveOptions({ avatar: `${'java'}${'script'}:alert(1)` }).avatar).toBe('');
  });

  it('keeps the rings and the contrast on a color that is not a hex', () => {
    widget = createChatWidget({ url: URL_ONE, color: 'rgb(10, 132, 255)' });
    const style = shadow().querySelector<HTMLElement>('.container')?.style;

    expect(style?.getPropertyValue('--w-ring')).toContain('color-mix');
    expect(style?.getPropertyValue('--w-on-color')).toBeTruthy();
  });

  it('lets the fan follow the size until a size of its own is set', () => {
    const grown = resolveOptions({ size: 'large' }, resolveOptions({ size: 'medium' }));
    expect(grown.actionSize).toBe(72);

    const own = resolveOptions({ size: 'large' }, resolveOptions({ actionSize: 40 }));
    expect(own.actionSize).toBe(40);
  });

  it('opens messenger links of the presets and drops the rest', () => {
    const resolved = resolveOptions({
      actions: [
        { id: 'viber', label: 'Viber', href: 'viber://chat?number=1' },
        { id: 'skype', label: 'Skype', href: 'skype:example?chat' },
        { id: 'bad', label: 'Bad', href: `${'java'}${'script'}:alert(1)` },
      ],
    });

    expect(resolved.actions[0].href).toBe('viber://chat?number=1');
    expect(resolved.actions[1].href).toBe('skype:example?chat');
    expect(resolved.actions[2].href).toBeUndefined();
  });

  it('reads a numeric looking title of a script tag as text', () => {
    expect(optionsFromDataset({ title: '2024', openAfter: '4000', pulse: 'false' })).toEqual({
      title: '2024',
      openAfter: 4000,
      pulse: false,
    });
  });

  it('shows a notification with the same id only once', () => {
    widget = createChatWidget({ url: URL_ONE });
    widget.notify({ text: 'First', id: 'welcome', timeout: 0 });
    widget.notify({ text: 'Second', id: 'welcome', timeout: 0 });

    expect(shadow().querySelector('.teaser')?.textContent).toContain('First');
  });

  it('takes messages only from the chat frame itself', () => {
    widget = createChatWidget({ url: URL_ONE, defer: false });
    const frame = shadow().querySelector<HTMLIFrameElement>('iframe');
    const from = { postMessage: () => {} } as unknown as Window;
    Object.defineProperty(frame, 'contentWindow', { value: from, configurable: true });
    const badge = () => shadow().querySelector<HTMLElement>('.multi_button > .multi_button_noty');

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://evil.example.com',
        source: from,
        data: { source: 'ai-kit-chat', type: 'unread', count: 7 },
      })
    );
    expect(badge()?.hidden).toBe(true);

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://chat.example.com',
        data: { source: 'ai-kit-chat', type: 'unread', count: 7 },
      })
    );
    expect(badge()?.hidden).toBe(true);

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://chat.example.com',
        source: from,
        data: { source: 'ai-kit-chat', type: 'unread', count: 7 },
      })
    );
    expect(badge()?.textContent).toBe('7');
  });

  it('applies new options and takes the widget off the page on destroy', () => {
    widget = createChatWidget({ url: URL_ONE, color: '#000000' });
    widget.setOptions({ color: '#ffffff', title: 'Support' });

    expect(
      shadow().querySelector<HTMLElement>('.container')?.style.getPropertyValue('--w-color')
    ).toBe('#ffffff');
    expect(shadow().querySelector('.header span')?.textContent).toBe('Support');

    widget.destroy();
    expect(document.querySelector('ai-kit-widget')).toBeNull();
    widget = undefined;
  });

  it('ties the spacing and the icons to the size', () => {
    const small = resolveOptions({ size: 'small' });
    const large = resolveOptions({ size: 'large' });
    const custom = resolveOptions({ size: 60, actionSize: 48, actionGap: 20 });

    expect(small.size).toBe(48);
    expect(small.actionSize).toBe(48);
    expect(small.actionGap).toBe(8);
    expect(large.size).toBe(72);
    expect(large.actionGap).toBe(12);
    expect(custom.actionSize).toBe(48);
    expect(custom.actionGap).toBe(20);
  });

  it('carries the size into the variables the layout is built on', () => {
    widget = createChatWidget({ url: URL_ONE, size: 'large' });
    const style = shadow().querySelector<HTMLElement>('.container')?.style;

    expect(style?.getPropertyValue('--w-size')).toBe('72px');
    expect(style?.getPropertyValue('--w-step')).toBe('84px');
    expect(style?.getPropertyValue('--w-inset')).toBe('7px');
  });

  it('drops the bubble and the timer as soon as the visitor touches the button', () => {
    jest.useFakeTimers();
    widget = createChatWidget({ url: URL_ONE, openAfter: 4000 });
    widget.notify({ text: 'Hello', timeout: 0 });
    expect(shadow().querySelector('.container')).toHaveAttribute('data-teaser');

    button().click();
    button().click();
    jest.advanceTimersByTime(500);
    expect(shadow().querySelector('.teaser')).toBeNull();
    expect(shadow().querySelector('.container')).not.toHaveAttribute('data-teaser');

    jest.advanceTimersByTime(4000);
    expect(shadow().querySelector('.container')).not.toHaveAttribute('data-opened');
  });

  it('closes what is open when the options take the widget off this device', () => {
    widget = createChatWidget({ url: URL_ONE });
    button().click();
    expect(shadow().querySelector('.container')).toHaveAttribute('data-opened');

    widget.setOptions({ devices: 'mobile' });
    const root = shadow().querySelector<HTMLElement>('.container');
    expect(root?.hidden).toBe(true);
    expect(root).not.toHaveAttribute('data-opened');
  });

  it('paints an action with its own background, icon color and badge', () => {
    widget = createChatWidget({
      url: URL_ONE,
      actions: [
        { id: 'chat', label: 'Chat', opensChat: true, unread: 12 },
        {
          id: 'telegram',
          label: 'Telegram',
          href: 'https://t.me/example',
          color: 'linear-gradient(90deg, #2aabee 0%, #229ed9 100%)',
          iconColor: '#001a2c',
        },
      ],
    });

    button().click();

    const telegram = shadow().querySelector<HTMLElement>('[data-action="telegram"]');
    expect(telegram?.getAttribute('style')).toContain('linear-gradient');
    expect(telegram?.getAttribute('style')).toContain('#001a2c');

    const badge = shadow().querySelector('[data-action="chat"] .multi_button_noty');
    expect(badge?.textContent).toBe('12');
    expect(shadow().querySelector<HTMLElement>('.multi_button > .multi_button_noty')?.hidden).toBe(
      true
    );
  });

  it('hides and brings back the whole widget', () => {
    widget = createChatWidget({ url: URL_ONE });
    const root = () => shadow().querySelector<HTMLElement>('.container');

    widget.hide();
    expect(root()?.hidden).toBe(true);

    widget.show();
    expect(root()?.hidden).toBe(false);
  });

  it('navigates the panel to another address and opens it', () => {
    widget = createChatWidget({ url: URL_ONE });
    widget.navigate('https://chat.example.com/other');

    expect(shadow().querySelector('iframe')).toHaveAttribute(
      'src',
      'https://chat.example.com/other'
    );
    expect(shadow().querySelector('.container')).toHaveAttribute('data-opened');
  });

  it('applies an option assigned on the live options object', () => {
    widget = createChatWidget({ url: URL_ONE, color: '#000000' });
    widget.options.color = '#123456';

    expect(
      shadow().querySelector<HTMLElement>('.container')?.style.getPropertyValue('--w-color')
    ).toBe('#123456');
    expect(widget.options.color).toBe('#123456');
  });

  it('keeps a bubble with timeout false until it is hidden', () => {
    jest.useFakeTimers();
    widget = createChatWidget({ url: URL_ONE });
    const bubble = widget.notify({ text: 'Stays', timeout: false });

    jest.advanceTimersByTime(60000);
    expect(shadow().querySelector('.teaser')).toBeInTheDocument();

    bubble.hide();
    jest.advanceTimersByTime(500);
    expect(shadow().querySelector('.teaser')).toBeNull();
  });

  it('puts the fan after the button so Tab walks into it', () => {
    widget = createChatWidget({
      url: URL_ONE,
      actions: [{ id: 'chat', label: 'Chat', opensChat: true }],
    });
    const root = shadow().querySelector('.container');
    const nodes = [...(root?.children ?? [])].map((node) => node.className);

    expect(nodes.indexOf('multi_list')).toBeGreaterThan(nodes.indexOf('multi_button_wrap'));
  });

  it('reads the corner and the distances from location', () => {
    widget = createChatWidget({ url: URL_ONE, location: ['top', 'left'] });
    let root = shadow().querySelector<HTMLElement>('.container');
    expect(root?.dataset.position).toBe('top-left');
    expect(root?.style.getPropertyValue('--w-x')).toBe('30px');

    widget.setOptions({ location: [-40, -20] });
    root = shadow().querySelector<HTMLElement>('.container');
    expect(root?.dataset.position).toBe('bottom-right');
    expect(root?.style.getPropertyValue('--w-y')).toBe('40px');
    expect(root?.style.getPropertyValue('--w-x')).toBe('20px');

    widget.setOptions({ location: [24, 16] });
    root = shadow().querySelector<HTMLElement>('.container');
    expect(root?.dataset.position).toBe('top-left');
    expect(root?.style.getPropertyValue('--w-y')).toBe('24px');
    expect(root?.style.getPropertyValue('--w-x')).toBe('16px');
  });

  it('reads the options of a script tag', () => {
    expect(
      optionsFromDataset({
        url: URL_ONE,
        openAfter: '4000',
        pulse: 'true',
        actions: '[{"id":"call","label":"Call"}]',
      })
    ).toEqual({
      url: URL_ONE,
      openAfter: 4000,
      pulse: true,
      actions: [{ id: 'call', label: 'Call' }],
    });
  });

  it('takes the options of the original widget tag', () => {
    widget = createChatWidget({
      shard: URL_ONE,
      location: ['bottom', 'left'],
      pulsation: true,
      start: 0,
      device: 'all',
      size: 'small',
      multiButton: [
        { name: 'chatbot', tooltip: 'Чат бот' },
        { name: 'telegram', tooltip: 'Telegram', href: 'https://t.me/example' },
      ],
    });

    const root = shadow().querySelector<HTMLElement>('.container');
    expect(root?.dataset.position).toBe('bottom-left');
    expect(root?.style.getPropertyValue('--w-size')).toBe('48px');
    expect(shadow().querySelector('.multi_button')).toHaveAttribute('data-pulse');
    expect(shadow().querySelector('[data-action="chatbot"]')).toHaveAttribute(
      'aria-label',
      'Чат бот'
    );
    expect(shadow().querySelector('[data-action="telegram"]')?.tagName).toBe('A');
  });

  it('merges a remote config and keeps what the page set itself', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ color: '#123456', title: 'Remote', position: 'top-left' }),
    });
    Object.defineProperty(window, 'fetch', { value: fetchMock, configurable: true });

    widget = chatWidget({
      url: URL_ONE,
      configUrl: 'https://cdn.example.com/widget.json',
      color: '#000000',
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example.com/widget.json', {
      credentials: 'omit',
    });
    const root = shadow().querySelector<HTMLElement>('.container');
    expect(root?.dataset.position).toBe('top-left');
    expect(root?.style.getPropertyValue('--w-color')).toBe('#000000');
  });
});
