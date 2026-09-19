import React, { memo, useId } from 'react';
import { Button, Group, Stack } from '@mantine/core';
import { useUncontrolled } from '@mantine/hooks';
import { Suggestions, type SuggestionItem } from '../input/Suggestions';
import { cx } from '../utils/cx';
import classes from './StarterCategories.module.css';

export type StarterCategory = {
  id: string;
  label: string;
  /** Icon before the label */
  icon?: React.ReactNode;
  /** Questions listed while the category is picked */
  starters: SuggestionItem[];
};

export interface StarterCategoriesLabels {
  /** Accessible name of the category row, `Categories` by default */
  categories: string;
}

export const DEFAULT_STARTER_CATEGORIES_LABELS: StarterCategoriesLabels = {
  categories: 'Categories',
};

export interface StarterCategoriesProps {
  categories: StarterCategory[];
  /** Id of the picked category, `null` when none is; controlled */
  value?: string | null;
  /** Category picked initially when uncontrolled, the first one by default */
  defaultValue?: string | null;
  /** Called with the picked category, or with `null` when the picked one is clicked again */
  onChange?: (id: string | null) => void;
  /** Called with the starter the user clicked */
  onSelect: (item: SuggestionItem) => void;
  /** Alignment of both rows, `start` by default as in `ChatWelcome` */
  align?: 'start' | 'center';
  /** Overrides of the default English labels */
  labels?: Partial<StarterCategoriesLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Starter questions grouped by category, for `emptyState.content` of `AgentChat` */
export const StarterCategories = memo(function StarterCategories({
  categories,
  value,
  defaultValue,
  onChange,
  onSelect,
  align = 'start',
  labels: labelsProp,
  className,
  style,
}: StarterCategoriesProps) {
  const labels = { ...DEFAULT_STARTER_CATEGORIES_LABELS, ...labelsProp };
  const listId = useId();
  const [active, setActive] = useUncontrolled<string | null>({
    value,
    defaultValue: defaultValue === undefined ? (categories[0]?.id ?? null) : defaultValue,
    finalValue: null,
    onChange,
  });
  const current = categories.find((category) => category.id === active);

  return (
    <Stack gap="sm" className={cx(classes.root, className)} style={style} data-align={align}>
      <Group
        gap="var(--ae-space-2xs)"
        justify={align === 'center' ? 'center' : 'flex-start'}
        role="group"
        aria-label={labels.categories}
      >
        {categories.map((category) => {
          const picked = category.id === active;
          return (
            <Button
              key={category.id}
              size="compact-sm"
              variant="subtle"
              color="gray"
              leftSection={category.icon}
              classNames={{ root: classes.category, section: classes.icon }}
              aria-pressed={picked}
              aria-controls={listId}
              onClick={() => setActive(picked ? null : category.id)}
            >
              {category.label}
            </Button>
          );
        })}
      </Group>
      <div id={listId} className={classes.starters}>
        {current && <Suggestions items={current.starters} onSelect={onSelect} />}
      </div>
    </Stack>
  );
});

StarterCategories.displayName = 'StarterCategories';
