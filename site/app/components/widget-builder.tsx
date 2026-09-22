"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import {
  ActionIcon,
  Box,
  Button,
  ColorInput,
  Divider,
  Group,
  Menu,
  NumberInput,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { IconCheck, IconCopy, IconPlus, IconTrash } from "@tabler/icons-react";
import { WIDGET_PRESETS, type WidgetPreset } from "@/app/data/widget-presets";
import { WIDGET_ICONS } from "@/app/data/widget-icons";
import { BUILT_IN_ICONS, MAX_ACTIONS } from "@sinups/ai-kit/embed";

type BuilderAction = {
  key: string;
  presetId: string;
  tooltip: string;
  href: string;
  unread: number;
};

const BUILT_IN_NAMES = Object.keys(BUILT_IN_ICONS).filter((name) => name !== "close");

function iconMarkup(value: string): string {
  if (BUILT_IN_ICONS[value]) {
    return BUILT_IN_ICONS[value];
  }
  const picked = WIDGET_ICONS.find((item) => item.name === value);
  return picked ? picked.svg : "";
}

function IconGlyph({ value }: { value: string }) {
  const markup = iconMarkup(value);
  if (!markup) {
    return (
      <Text size="xs" tt="capitalize">
        {value}
      </Text>
    );
  }
  return (
    <Box
      w={18}
      h={18}
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      dangerouslySetInnerHTML={{ __html: markup.replace(/width="\d+"/, 'width="18"').replace(/height="\d+"/, 'height="18"') }}
    />
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <div>
      <Text size="sm" fw={500} mb={6}>
        Icon
      </Text>
      <Menu position="bottom-start" withinPortal shadow="md">
        <Menu.Target>
          <Button
            variant="default"
            leftSection={<IconGlyph value={value} />}
            justify="space-between"
            fullWidth
          >
            <Text size="sm" tt="capitalize">
              {value}
            </Text>
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Box p={6} style={{ display: "grid", gridTemplateColumns: "repeat(8, 32px)", gap: 4, maxHeight: 260, overflowY: "auto" }}>
            {[...BUILT_IN_NAMES, ...WIDGET_ICONS.map((item) => item.name)].map((name) => (
              <ActionIcon
                key={name}
                variant={name === value ? "filled" : "subtle"}
                color={name === value ? undefined : "gray"}
                aria-label={name}
                onClick={() => onChange(name)}
              >
                <IconGlyph value={name} />
              </ActionIcon>
            ))}
          </Box>
        </Menu.Dropdown>
      </Menu>
    </div>
  );
}

const ANIMATIONS = [
  { value: "circle", label: "Circle" },
  { value: "coin", label: "Coin" },
  { value: "flip", label: "Flip" },
];

function preset(id: string): WidgetPreset {
  return WIDGET_PRESETS.find((item) => item.id === id) ?? WIDGET_PRESETS[0];
}

function PresetIcon({ id }: { id: string }) {
  const item = preset(id);
  return (
    <Box
      w={22}
      h={22}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        background: item.color || "var(--mantine-color-dark-6)",
        color: "var(--mantine-color-white)",
      }}
      dangerouslySetInnerHTML={{
        __html: item.icon.replace(/width="\d+"/, 'width="12"').replace(/height="\d+"/, 'height="12"'),
      }}
    />
  );
}

function CopyButton({ value, label = "Copy the code" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="xs"
      variant="default"
      leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}

export function WidgetBuilder() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState("script");
  const [url, setUrl] = useState("https://chat.example.com/widget");
  const [title, setTitle] = useState("Assistant");
  const [devices, setDevices] = useState("all");
  const [icon, setIcon] = useState("chat");
  const [size, setSize] = useState("medium");
  const [color, setColor] = useState("rgb(17, 17, 17)");
  const [side, setSide] = useState("right");
  const [edge, setEdge] = useState("bottom");
  const [offsetX, setOffsetX] = useState(30);
  const [offsetY, setOffsetY] = useState(30);
  const [openAfter, setOpenAfter] = useState(0);
  const [openOnMobile, setOpenOnMobile] = useState(false);
  const [mobileHeight, setMobileHeight] = useState(100);
  const [remember, setRemember] = useState(true);
  const [avatar, setAvatar] = useState("");
  const [animation, setAnimation] = useState("coin");
  const [pulse, setPulse] = useState(true);
  const [theme, setTheme] = useState("auto");
  const [actions, setActions] = useState<BuilderAction[]>([
    { key: "a1", presetId: "chat", tooltip: preset("chat").tooltip, href: "", unread: 0 },
    {
      key: "a2",
      presetId: "callback",
      tooltip: preset("callback").tooltip,
      href: preset("callback").href ?? "",
      unread: 0,
    },
  ]);

  const config = useMemo(() => {
    const value: Record<string, unknown> = {
      url,
      position: `${edge}-${side}`,
      offset: offsetX === offsetY ? offsetX : { x: offsetX, y: offsetY },
      color,
      size,
      icon: BUILT_IN_ICONS[icon] ? icon : iconMarkup(icon) || icon,
    };
    if (title) {
      value.title = title;
    }
    if (devices !== "all") {
      value.devices = devices;
    }
    if (openAfter > 0) {
      value.openAfter = openAfter * 1000;
      value.openAfterOnMobile = openOnMobile;
      value.remember = remember;
    }
    if (mobileHeight !== 100) {
      value.mobileHeight = mobileHeight;
    }
    if (avatar) {
      value.avatar = avatar;
      value.iconAnimation = animation;
    }
    if (pulse) {
      value.pulse = true;
    }
    if (theme !== "auto") {
      value.theme = theme;
    }
    value.actions = actions.map((action) => {
      const item = preset(action.presetId);
      return {
        id: action.presetId,
        label: action.tooltip || item.label,
        icon: item.icon,
        ...(item.color ? { color: item.color } : {}),
        ...(item.opensChat ? { opensChat: true } : { href: action.href || item.href }),
        ...(action.unread > 0 ? { unread: action.unread } : {}),
      };
    });
    return value;
  }, [
    url,
    title,
    devices,
    icon,
    size,
    color,
    side,
    edge,
    offsetX,
    offsetY,
    openAfter,
    openOnMobile,
    mobileHeight,
    remember,
    avatar,
    animation,
    pulse,
    theme,
    actions,
  ]);

  const json = useMemo(() => JSON.stringify(config, null, 2), [config]);
  const script = useMemo(
    () =>
      [
        '<script src="https://cdn.jsdelivr.net/npm/@sinups/ai-kit/dist/embed/widget.js" defer></script>',
        "<script>",
        '  window.addEventListener("load", () => {',
        `    window.aiKitChat = AiKitChat(${json.replace(/\n/g, "\n    ")});`,
        "  });",
        "</script>",
      ].join("\n"),
    [json],
  );

  const [debouncedConfig] = useDebouncedValue(config, 400);

  const previewSrc = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const preview = { ...debouncedConfig, url: "", zIndex: 20 };
    return [
      '<!doctype html><html><head><meta charset="utf-8"><style>',
      "html,body{height:100%;margin:0;font:15px/1.5 system-ui,sans-serif;background:Canvas;color:CanvasText}",
      ".sheet{padding:24px}",
      ".bar{height:12px;border-radius:6px;background:color-mix(in srgb, CanvasText 10%, transparent);margin-bottom:12px}",
      ".bar.short{width:45%}",
      "</style></head><body>",
      '<div class="sheet"><div class="bar short"></div><div class="bar"></div><div class="bar"></div><div class="bar short"></div></div>',
      `<${"script"} src="${base}/widget.js"></${"script"}>`,
      `<${"script"}>window.aiKitChat = AiKitChat(${JSON.stringify(preview)});</${"script"}>`,
      "</body></html>",
    ].join("");
  }, [debouncedConfig]);

  useEffect(() => setMounted(true), []);

  const update = (index: number, patch: Partial<BuilderAction>) => {
    setActions((current) =>
      current.map((action, position) => (position === index ? { ...action, ...patch } : action)),
    );
  };

  return (
    <div>
      <Stack gap="md">
        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" align="flex-end">
            <Text fw={500}>Where the widget is shown</Text>
            <Select
              w={220}
              data={[
                { value: "all", label: "Any device" },
                { value: "desktop", label: "Desktop only" },
                { value: "mobile", label: "Phones only" },
              ]}
              value={devices}
              onChange={(value) => setDevices(value ?? "all")}
              allowDeselect={false}
            />
          </Group>
          <Divider my="md" />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <Stack gap="sm">
              <Text fw={500}>Button</Text>
              <IconPicker value={icon} onChange={setIcon} />
              <Select
                label="Size"
                data={[
                  { value: "small", label: "Small" },
                  { value: "medium", label: "Medium" },
                  { value: "large", label: "Large" },
                ]}
                value={size}
                onChange={(value) => setSize(value ?? "medium")}
                allowDeselect={false}
              />
              <ColorInput label="Color" value={color} onChange={setColor} format="rgb" />
            </Stack>
            <Stack gap="sm">
              <Text fw={500}>Placement</Text>
              <div>
                <Text size="sm" fw={500} mb={6}>
                  Corner
                </Text>
                <Stack gap={6}>
                  <SegmentedControl
                    fullWidth
                    value={edge}
                    onChange={setEdge}
                    data={[
                      { value: "bottom", label: "Bottom" },
                      { value: "top", label: "Top" },
                    ]}
                  />
                  <SegmentedControl
                    fullWidth
                    value={side}
                    onChange={setSide}
                    data={[
                      { value: "left", label: "Left" },
                      { value: "right", label: "Right" },
                    ]}
                  />
                </Stack>
              </div>
              <NumberInput
                label="Side offset, px"
                min={0}
                max={120}
                value={offsetX}
                onChange={(value) => setOffsetX(Number(value) || 0)}
              />
              <NumberInput
                label="Bottom offset, px"
                min={0}
                max={120}
                value={offsetY}
                onChange={(value) => setOffsetY(Number(value) || 0)}
              />
            </Stack>
            <Stack gap="sm">
              <Text fw={500}>Opening</Text>
              <NumberInput
                label="Open after, seconds"
                description="0 keeps it closed"
                min={0}
                max={300}
                value={openAfter}
                onChange={(value) => setOpenAfter(Number(value) || 0)}
              />
              <Switch
                label="Open on phones too"
                checked={openOnMobile}
                onChange={(event) => setOpenOnMobile(event.currentTarget.checked)}
                disabled={openAfter === 0}
              />
              <Switch
                label="Skip the timer once the visitor closed it"
                checked={remember}
                onChange={(event) => setRemember(event.currentTarget.checked)}
                disabled={openAfter === 0}
              />
              <NumberInput
                label="Panel height on phones, %"
                min={40}
                max={100}
                value={mobileHeight}
                onChange={(value) => setMobileHeight(Number(value) || 100)}
              />
            </Stack>
            <Stack gap="sm">
              <Text fw={500}>Animation</Text>
              <TextInput
                label="Avatar"
                description="Second face of the button"
                placeholder="https://example.com/ada.png"
                value={avatar}
                onChange={(event) => setAvatar(event.currentTarget.value)}
              />
              <Select
                label="Animation type"
                data={ANIMATIONS}
                value={animation}
                onChange={(value) => setAnimation(value ?? "coin")}
                disabled={!avatar}
                allowDeselect={false}
              />
              <Switch
                label="Rings around the closed button"
                checked={pulse}
                onChange={(event) => setPulse(event.currentTarget.checked)}
              />
              <Select
                label="Color scheme"
                data={[
                  { value: "auto", label: "Follow the visitor" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
                value={theme}
                onChange={(value) => setTheme(value ?? "auto")}
                allowDeselect={false}
              />
            </Stack>
          </div>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" mb="sm">
            <Group gap={8} align="baseline">
              <Text fw={500}>Actions</Text>
              <Text size="sm" c="dimmed">
                {MAX_ACTIONS} max
              </Text>
            </Group>
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <Button
                  size="xs"
                  variant="default"
                  leftSection={<IconPlus size={14} />}
                  disabled={actions.length >= MAX_ACTIONS}
                >
                  Add
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {WIDGET_PRESETS.map((item) => (
                  <Menu.Item
                    key={item.id}
                    leftSection={<PresetIcon id={item.id} />}
                    onClick={() =>
                      setActions((current) => [
                        ...current,
                        {
                          key: `${item.id}-${current.length}`,
                          presetId: item.id,
                          tooltip: item.tooltip,
                          href: item.href ?? "",
                          unread: 0,
                        },
                      ])
                    }
                  >
                    {item.label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          </Group>
          <Stack gap="sm">
            {actions.map((action, index) => {
              const item = preset(action.presetId);
              return (
                <Paper key={action.key} withBorder radius="sm" p="sm">
                  <Group align="flex-end" wrap="wrap" gap="sm">
                    <Select
                      w={200}
                      label="Type"
                      leftSection={<PresetIcon id={action.presetId} />}
                      data={WIDGET_PRESETS.map((entry) => ({ value: entry.id, label: entry.label }))}
                      value={action.presetId}
                      onChange={(value) => {
                        const next = preset(value ?? "chat");
                        update(index, {
                          presetId: next.id,
                          tooltip: next.tooltip,
                          href: next.href ?? "",
                        });
                      }}
                      allowDeselect={false}
                    />
                    <TextInput
                      style={{ flex: "1 1 220px" }}
                      label="Tooltip"
                      value={action.tooltip}
                      onChange={(event) => update(index, { tooltip: event.currentTarget.value })}
                    />
                    {!item.opensChat && (
                      <TextInput
                        style={{ flex: "1 1 220px" }}
                        label="Link"
                        value={action.href}
                        onChange={(event) => update(index, { href: event.currentTarget.value })}
                      />
                    )}
                    <NumberInput
                      w={86}
                      label="Badge"
                      min={0}
                      max={99}
                      value={action.unread}
                      onChange={(value) => update(index, { unread: Number(value) || 0 })}
                    />
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      aria-label="Remove the action"
                      onClick={() => setActions((current) => current.filter((_, i) => i !== index))}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" mb="sm" align="flex-end">
            <Text fw={500}>Code to paste</Text>
            <Group gap="sm">
              <TextInput
                w={280}
                label="Chat address"
                value={url}
                onChange={(event) => setUrl(event.currentTarget.value)}
              />
              <TextInput
                w={200}
                label="Panel title"
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
              />
            </Group>
          </Group>
          <Tabs value={tab} onChange={(value) => setTab(value ?? "script")}>
            <Group justify="space-between" mb="sm">
              <Tabs.List>
                <Tabs.Tab value="script">Script tag</Tabs.Tab>
                <Tabs.Tab value="json">JSON</Tabs.Tab>
              </Tabs.List>
              <CopyButton value={tab === "json" ? json : script} />
            </Group>
            <Tabs.Panel value="script">
              <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
                {script}
              </pre>
            </Tabs.Panel>
            <Tabs.Panel value="json">
              <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
                {json}
              </pre>
            </Tabs.Panel>
          </Tabs>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" mb="sm">
            <Text fw={500}>Preview</Text>
            <Text size="xs" c="dimmed">
              The panel opens empty here: the chat address is only used on your own page
            </Text>
          </Group>
          {mounted ? (
            <iframe
              key={previewSrc}
              title="Widget preview"
              srcDoc={previewSrc}
              className="h-[560px] w-full rounded-lg border border-border bg-background"
            />
          ) : (
            <div className="h-[560px] w-full rounded-lg border border-border bg-muted/30" />
          )}
          <Text size="xs" c="dimmed" mt={8}>
            Brand marks in the presets belong to their owners; the package itself ships none.
          </Text>
        </Paper>
      </Stack>
    </div>
  );
}
