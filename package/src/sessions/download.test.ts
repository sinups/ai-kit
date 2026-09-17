import { downloadFile } from './download';

describe('sessions/downloadFile', () => {
  it('clicks a temporary link with the file name and a blob url', () => {
    const createObjectURL = jest.fn(() => 'blob:export');
    const revokeObjectURL = jest.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const clicks: HTMLAnchorElement[] = [];
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        clicks.push(this);
      });
    jest.useFakeTimers();

    downloadFile('chat.md', '# Hi', 'text/markdown');

    const blob = (createObjectURL.mock.calls[0] as unknown as [Blob])[0];
    expect(blob.type).toBe('text/markdown;charset=utf-8');
    expect(clicks).toHaveLength(1);
    expect(clicks[0].download).toBe('chat.md');
    expect(clicks[0].getAttribute('href')).toBe('blob:export');
    expect(document.querySelector('a[download]')).toBeNull();

    jest.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export');
    jest.useRealTimers();
    click.mockRestore();
  });
});
