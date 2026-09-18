import React, { createContext, useContext, useMemo } from 'react';

export type MarkdownLinkHandler = (
  href: string,
  event: React.MouseEvent<HTMLAnchorElement>
) => void;

export type MarkdownLinks = {
  /** Called on a click on any link of the answer; call `event.preventDefault()` to keep the browser from following it */
  onLinkClick?: MarkdownLinkHandler;
  /** URL schemes that belong to the host, such as `artifact`; such a link never navigates and only reaches `onLinkClick` */
  linkSchemes?: string[];
};

const MarkdownLinksContext = createContext<MarkdownLinks>({});

export interface MarkdownLinksProviderProps extends MarkdownLinks {
  children: React.ReactNode;
}

/** Hands a link handler and extra link schemes to every `Markdown` inside, for example the answers of `AgentChat` */
export function MarkdownLinksProvider({
  onLinkClick,
  linkSchemes,
  children,
}: MarkdownLinksProviderProps) {
  const outer = useContext(MarkdownLinksContext);
  const value = useMemo(
    () => ({
      onLinkClick: onLinkClick ?? outer.onLinkClick,
      linkSchemes: linkSchemes ?? outer.linkSchemes,
    }),
    [onLinkClick, linkSchemes, outer]
  );
  return <MarkdownLinksContext.Provider value={value}>{children}</MarkdownLinksContext.Provider>;
}

export function useMarkdownLinks(): MarkdownLinks {
  return useContext(MarkdownLinksContext);
}
