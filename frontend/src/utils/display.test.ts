import { formatDisplayValue } from '@utils/display';

describe('formatDisplayValue', () => {
  test('returns Unknown for missing placeholder values', () => {
    expect(formatDisplayValue()).toBe('Unknown');
    expect(formatDisplayValue(null)).toBe('Unknown');
    expect(formatDisplayValue('n/a')).toBe('Unknown');
    expect(formatDisplayValue('unknown')).toBe('Unknown');
  });

  test('returns the original value for displayable content', () => {
    expect(formatDisplayValue('Tatooine')).toBe('Tatooine');
  });
});
