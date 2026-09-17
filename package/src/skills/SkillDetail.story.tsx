import React, { useState } from 'react';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { skills } from './fixtures';
import { SkillDetail } from './SkillDetail';

export default { title: 'skills/SkillDetail' };

function Demo({ index = 0 }: { index?: number }) {
  const [skill, setSkill] = useState(skills[index]);
  return (
    <SkillDetail
      skill={skill}
      locale="en-US"
      onEdit={() => {}}
      onToggle={async (_, enabled) => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setSkill((current) => ({ ...current, enabled }));
      }}
    />
  );
}

export function Usage() {
  return (
    <WidthFrame width={560}>
      <Demo />
    </WidthFrame>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo />
    </WidthFrame>
  );
}

export function Minimal() {
  return (
    <WidthFrame width={560}>
      <Demo index={4} />
    </WidthFrame>
  );
}
