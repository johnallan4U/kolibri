import { isComplete, groupIncompleteBySubject } from '../useAssignedContentGrouping';

function makeNode(overrides = {}) {
  return {
    id: 'node-1',
    title: 'Some Node',
    channel_id: 'channel-1',
    completedCount: 0,
    totalCount: 0,
    ...overrides,
  };
}

describe('isComplete', () => {
  it('is false when nothing has been completed', () => {
    expect(isComplete(makeNode({ completedCount: 0, totalCount: 5 }))).toBe(false);
  });

  it('is false when only some of it has been completed', () => {
    expect(isComplete(makeNode({ completedCount: 3, totalCount: 5 }))).toBe(false);
  });

  it('is true once every part of it has been completed', () => {
    expect(isComplete(makeNode({ completedCount: 5, totalCount: 5 }))).toBe(true);
  });

  it('is false for a totalCount of 0 (nothing to show as done)', () => {
    expect(isComplete(makeNode({ completedCount: 0, totalCount: 0 }))).toBe(false);
  });
});

describe('groupIncompleteBySubject', () => {
  it('groups nodes by channel_id, using getChannelTitle for the label', () => {
    const getChannelTitle = jest.fn(channelId =>
      channelId === 'channel-math' ? 'Math' : 'Reading',
    );
    const mathNode = makeNode({ id: 'math-1', channel_id: 'channel-math' });
    const readingNode = makeNode({ id: 'reading-1', channel_id: 'channel-reading' });

    const groups = groupIncompleteBySubject([mathNode, readingNode], getChannelTitle);

    expect(groups).toEqual([
      { channelId: 'channel-math', title: 'Math', nodes: [mathNode] },
      { channelId: 'channel-reading', title: 'Reading', nodes: [readingNode] },
    ]);
  });

  it('sorts groups alphabetically by title', () => {
    const getChannelTitle = jest.fn(channelId =>
      channelId === 'channel-z' ? 'Zoology' : 'Arithmetic',
    );
    const groups = groupIncompleteBySubject(
      [makeNode({ channel_id: 'channel-z' }), makeNode({ channel_id: 'channel-a' })],
      getChannelTitle,
    );

    expect(groups.map(g => g.title)).toEqual(['Arithmetic', 'Zoology']);
  });

  it('excludes completed nodes entirely', () => {
    const getChannelTitle = jest.fn(() => 'Math');
    const groups = groupIncompleteBySubject(
      [makeNode({ id: 'done', completedCount: 5, totalCount: 5 })],
      getChannelTitle,
    );

    expect(groups).toEqual([]);
  });

  it('falls back to the raw channel id when the channel has no known title', () => {
    const getChannelTitle = jest.fn(() => '');
    const groups = groupIncompleteBySubject(
      [makeNode({ channel_id: 'unknown-channel' })],
      getChannelTitle,
    );

    expect(groups[0].title).toBe('unknown-channel');
  });
});
