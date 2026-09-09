/**
 * `useAssignedContent` composable function mock.
 *
 * If default values are sufficient for tests,
 * you only need call `jest.mock('<useAssignedContent file path>')`
 * at the top of a test file.
 *
 * If you need to override some default values from some tests,
 * you can import a helper function `useAssignedContentMock` that accepts
 * an object with values to be overriden and use it together
 * with  `mockImplementation` as follows:
 *
 * ```
 * // eslint-disable-next-line import-x/named
 * import useAssignedContent, { useAssignedContentMock } from '<useAssignedContent file path>';
 *
 * jest.mock('<useAssignedContent file path>')
 *
 * it('test', () => {
 *   useAssignedContent.mockImplementation(
 *    () => useAssignedContentMock({ assignedContentNodes: [{ id: 'node-1' }] })
 *   );
 * })
 * ```
 */

const MOCK_DEFAULTS = {
  assignedContentNodes: [],
  fetchAssignedContent: jest.fn(() => Promise.resolve([])),
};

export function useAssignedContentMock(overrides = {}) {
  return {
    ...MOCK_DEFAULTS,
    ...overrides,
  };
}

export default jest.fn(() => useAssignedContentMock());
