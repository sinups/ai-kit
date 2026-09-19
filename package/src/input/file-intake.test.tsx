import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import { filterFiles, useFileIntake, type FileIntakePolicy } from './file-intake';

function file(name: string, type: string, size = 10): File {
  const created = new File(['x'], name, { type });
  Object.defineProperty(created, 'size', { value: size });
  return created;
}

const png = file('shot.png', 'image/png');
const pdf = file('spec.pdf', 'application/pdf');
const big = file('video.mp4', 'video/mp4', 5_000);
const txt = file('notes.txt', 'text/plain');

describe('input/filterFiles', () => {
  const cases: [string, File[], FileIntakePolicy, string[], [string, string][]][] = [
    ['no policy accepts everything', [png, pdf], {}, ['shot.png', 'spec.pdf'], []],
    ['image/* mask', [png, pdf], { accept: ['image/*'] }, ['shot.png'], [['spec.pdf', 'type']]],
    ['.pdf extension', [png, pdf], { accept: ['.pdf'] }, ['spec.pdf'], [['shot.png', 'type']]],
    [
      'exact MIME type',
      [txt, pdf],
      { accept: ['text/plain'] },
      ['notes.txt'],
      [['spec.pdf', 'type']],
    ],
    ['size limit', [png, big], { maxFileSize: 1_000 }, ['shot.png'], [['video.mp4', 'size']]],
    [
      'count limit',
      [png, pdf, txt],
      { maxFiles: 2 },
      ['shot.png', 'spec.pdf'],
      [['notes.txt', 'count']],
    ],
    [
      'count limit with current',
      [png, pdf],
      { maxFiles: 2, current: 1 },
      ['shot.png'],
      [['spec.pdf', 'count']],
    ],
    [
      'type before size',
      [big],
      { accept: ['image/*'], maxFileSize: 1 },
      [],
      [['video.mp4', 'type']],
    ],
    ['any-type mask', [png, pdf], { accept: ['*/*'] }, ['shot.png', 'spec.pdf'], []],
  ];

  it.each(cases)('%s', (_, files, policy, accepted, rejected) => {
    const result = filterFiles(files, policy);
    expect(result.accepted.map((item) => item.name)).toEqual(accepted);
    expect(result.rejected.map((item) => [item.file.name, item.reason])).toEqual(rejected);
  });
});

function Harness({ onFiles, onReject }: { onFiles: jest.Mock; onReject: jest.Mock }) {
  const intake = useFileIntake({ accept: ['image/*'], onFiles, onReject });
  return (
    <div>
      <textarea aria-label="Field" onPaste={intake.onPaste} />
      <button type="button" onClick={intake.open}>
        Attach
      </button>
      {intake.input}
    </div>
  );
}

describe('input/useFileIntake', () => {
  it('takes pasted files through the policy', () => {
    const onFiles = jest.fn();
    const onReject = jest.fn();
    render(<Harness onFiles={onFiles} onReject={onReject} />);

    fireEvent.paste(screen.getByLabelText('Field'), { clipboardData: { files: [png, pdf] } });
    expect(onFiles).toHaveBeenCalledWith([png]);
    expect(onReject).toHaveBeenCalledWith([{ file: pdf, reason: 'type' }]);
  });

  it('leaves a text paste alone', () => {
    const onFiles = jest.fn();
    render(<Harness onFiles={onFiles} onReject={jest.fn()} />);

    const event = fireEvent.paste(screen.getByLabelText('Field'), {
      clipboardData: { files: [], getData: () => 'hello' },
    });
    expect(event).toBe(true);
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('opens a hidden input that stays out of the tab order', () => {
    const onFiles = jest.fn();
    const { container } = render(<Harness onFiles={onFiles} onReject={jest.fn()} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const click = jest.spyOn(input, 'click');

    fireEvent.click(screen.getByRole('button', { name: 'Attach' }));
    expect(click).toHaveBeenCalled();
    expect(input).toHaveAttribute('tabindex', '-1');
    expect(input).toHaveAttribute('aria-hidden', 'true');
    expect(input).toHaveAttribute('accept', 'image/*');

    fireEvent.change(input, { target: { files: [png] } });
    expect(onFiles).toHaveBeenCalledWith([png]);
  });
});
