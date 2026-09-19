import React from 'react';
import { Group } from '@mantine/core';
import { FileAttachment } from '../input/FileAttachment';
import type { CallToolResult } from '../rows/tool-output';
import { isSafeMediaUrl } from '../utils/safe-url';

/**
 * Images, audio and resources of an MCP tool result: an image as a thumbnail with a preview, audio
 * in the native player, a resource as a file chip that links to its `uri` when it is safe.
 */
export function ToolResultContent({
  result,
  messageId,
}: {
  result: CallToolResult;
  messageId: string;
}) {
  const nodes = result.content.map((block, index) => {
    const id = `${messageId}-${index}`;
    if (block.type === 'image' || block.type === 'audio') {
      const url = `data:${block.mimeType};base64,${block.data}`;
      if (!isSafeMediaUrl(url)) {
        return null;
      }
      return block.type === 'image' ? (
        <FileAttachment
          key={id}
          id={id}
          filename={block.mimeType}
          isImage
          url={url}
          display="image-only"
        />
      ) : (
        <audio key={id} controls preload="none" src={url} aria-label={block.mimeType} />
      );
    }
    if (block.type === 'resource_link' || block.type === 'resource') {
      const uri = block.type === 'resource' ? block.resource.uri : block.uri;
      const name = block.type === 'resource' ? uri : (block.title ?? block.name);
      const chip = <FileAttachment id={id} filename={name} />;
      return isSafeMediaUrl(uri) && !uri.startsWith('data:') ? (
        <a key={id} href={uri} target="_blank" rel="noopener noreferrer" aria-label={name}>
          {chip}
        </a>
      ) : (
        <React.Fragment key={id}>{chip}</React.Fragment>
      );
    }
    return null;
  });
  if (nodes.every((node) => node === null)) {
    return null;
  }
  return (
    <Group gap="xs" align="flex-start">
      {nodes}
    </Group>
  );
}
