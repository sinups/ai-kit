const FACTS = [
  {
    title: "Follows your Mantine theme",
    description: "Colors, radius, fonts and color scheme come from the theme you already have.",
  },
  {
    title: "Tree-shakable",
    description: "Import one component and ship only that. The Wizard adds about 4 KB.",
  },
  {
    title: "Tested",
    description: "Storybook interaction tests and visual regression checks on every change.",
  },
];

export function FactsSection() {
  return (
    <section aria-label="Why AI UI Kit" className="border-t border-border px-4 py-14 sm:px-6 sm:py-16">
      <dl className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
        {FACTS.map((fact) => (
          <div key={fact.title} className="flex flex-col gap-2 sm:px-8 sm:first:pl-0 sm:last:pr-0">
            <dt className="text-lg font-medium tracking-[-0.02em] text-foreground">{fact.title}</dt>
            <dd className="text-pretty text-[15px] leading-relaxed text-muted-foreground">{fact.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
