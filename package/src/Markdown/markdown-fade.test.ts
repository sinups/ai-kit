import { splitByFadeMarks, trackFadeMarks, type FadeMark } from './markdown-fade';

describe('Markdown/fade marks', () => {
  it('remembers where the answer ended and forgets settled marks', () => {
    let marks = trackFadeMarks([], 10, 1000);
    marks = trackFadeMarks(marks, 16, 1100);
    expect(marks).toEqual([
      { total: 10, at: 1000 },
      { total: 16, at: 1100 },
    ]);

    marks = trackFadeMarks(marks, 22, 1400);
    expect(marks).toEqual([
      { total: 16, at: 1100 },
      { total: 22, at: 1400 },
    ]);
  });

  it('keeps the marks unchanged while nothing new arrives', () => {
    const marks = trackFadeMarks(trackFadeMarks([], 10, 1000), 10, 1050);
    expect(marks).toEqual([{ total: 10, at: 1000 }]);
  });

  it('starts over when the answer is replaced by a shorter one', () => {
    const marks = trackFadeMarks(trackFadeMarks([], 40, 1000), 3, 1010);
    expect(marks).toEqual([]);
  });

  it('cuts a node into the settled part and the batches after it', () => {
    const marks: FadeMark[] = [
      { total: 5, at: 1000 },
      { total: 9, at: 1100 },
    ];
    expect(splitByFadeMarks('Five seats now', 0, marks)).toEqual([
      { text: 'Five ' },
      { text: 'seat', from: 5 },
      { text: 's now', from: 9 },
    ]);
  });

  it('leaves a node that is settled whole alone', () => {
    const marks: FadeMark[] = [{ total: 20, at: 1000 }];
    expect(splitByFadeMarks('Five seats', 0, marks)).toEqual([{ text: 'Five seats' }]);
  });

  it('fades a node that arrived whole after the last mark', () => {
    const marks: FadeMark[] = [{ total: 4, at: 1000 }];
    expect(splitByFadeMarks('seats', 4, marks)).toEqual([{ text: 'seats', from: 4 }]);
  });

  it('fades everything while no mark is remembered yet', () => {
    expect(splitByFadeMarks('Five', 0, [])).toEqual([{ text: 'Five' }]);
  });
});
