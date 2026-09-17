import { TOOL_CATALOG } from './fixtures';
import {
  getGroupCheckState,
  groupToolCatalog,
  searchToolCatalog,
  toggleTool,
  toggleToolGroup,
} from './tool-selection';

describe('agents/tool-selection', () => {
  it('groups the catalog in order of appearance', () => {
    const groups = groupToolCatalog(TOOL_CATALOG);
    expect(groups.map((group) => group.name)).toEqual([
      'Built-in',
      'MCP: git',
      'MCP: issues',
      'MCP: postgres',
    ]);
    expect(groups[0].tools).toHaveLength(8);
  });

  it('searches by name, title and group', () => {
    expect(searchToolCatalog(TOOL_CATALOG, '')).toBe(TOOL_CATALOG);
    expect(searchToolCatalog(TOOL_CATALOG, 'grep').map((tool) => tool.name)).toContain('Grep');
    expect(searchToolCatalog(TOOL_CATALOG, 'merge pull').map((tool) => tool.name)).toContain(
      'mcp__git__merge_pull_request'
    );
    const postgres = searchToolCatalog(TOOL_CATALOG, 'postgres').map((tool) => tool.name);
    expect(postgres).toEqual(['mcp__postgres__query', 'mcp__postgres__execute']);
  });

  it('computes the group check state', () => {
    const tools = TOOL_CATALOG.filter((tool) => tool.group === 'MCP: postgres');
    expect(getGroupCheckState(tools, [])).toBe('unchecked');
    expect(getGroupCheckState(tools, ['mcp__postgres__query'])).toBe('indeterminate');
    expect(getGroupCheckState(tools, ['mcp__postgres__query', 'mcp__postgres__execute'])).toBe(
      'checked'
    );
  });

  it('toggles tools and groups', () => {
    expect(toggleTool(['Read'], 'Grep', true)).toEqual(['Read', 'Grep']);
    expect(toggleTool(['Read'], 'Read', true)).toEqual(['Read']);
    expect(toggleTool(['Read', 'Grep'], 'Read', false)).toEqual(['Grep']);

    const tools = TOOL_CATALOG.filter((tool) => tool.group === 'MCP: postgres');
    expect(toggleToolGroup(['Read', 'mcp__postgres__query'], tools, true)).toEqual([
      'Read',
      'mcp__postgres__query',
      'mcp__postgres__execute',
    ]);
    expect(toggleToolGroup(['Read', 'mcp__postgres__query'], tools, false)).toEqual(['Read']);
  });
});
