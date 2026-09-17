import type React from 'react';

export type SettingsNavItem = {
  /** Unique section id passed to `onActiveChange` */
  id: string;
  /** Navigation label, also used by the search filter */
  label: string;
  /** Icon rendered before the label */
  icon?: React.ReactNode;
  /** Secondary text under the label, also used by the search filter */
  description?: string;
  /** Content on the right side of the navigation item, for example a counter `Badge` */
  badge?: React.ReactNode;
  /** Group heading the item is listed under, items without a group come first */
  group?: string;
  /** Prevents selecting the section */
  disabled?: boolean;
  /** Stretches the section content to the full height without the layout scroll area, overrides `fillContent` of the layout */
  fill?: boolean;
};

export type SettingsNavGroup = {
  group: string | undefined;
  items: SettingsNavItem[];
};

function normalize(text: string): string {
  return text.toLocaleLowerCase().normalize('NFKD');
}

export function filterSettingsNav(sections: SettingsNavItem[], query: string): SettingsNavItem[] {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return sections;
  }
  return sections.filter((section) => {
    const haystack = normalize(`${section.label} ${section.description ?? ''}`);
    return tokens.every((token) => haystack.includes(token));
  });
}

export function groupSettingsNav(sections: SettingsNavItem[]): SettingsNavGroup[] {
  const ungrouped: SettingsNavItem[] = [];
  const groups = new Map<string, SettingsNavItem[]>();
  for (const section of sections) {
    if (section.group === undefined) {
      ungrouped.push(section);
      continue;
    }
    const items = groups.get(section.group);
    if (items) {
      items.push(section);
    } else {
      groups.set(section.group, [section]);
    }
  }
  const result: SettingsNavGroup[] = ungrouped.length
    ? [{ group: undefined, items: ungrouped }]
    : [];
  for (const [group, items] of groups) {
    result.push({ group, items });
  }
  return result;
}
