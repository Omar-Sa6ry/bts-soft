import { LowerWords, CapitalizeWords } from './WordsTransform.decorator';

describe('WordsTransform Utilities', () => {
  it('should transform words to lowercase', () => {
    expect(LowerWords('OMAR SABRY')).toBe('omar sabry');
    expect(LowerWords('  Space  ')).toBe('  space  ');
  });

  it('should capitalize words correctly', () => {
    expect(CapitalizeWords('omar sabry')).toBe('Omar Sabry');
    expect(CapitalizeWords('NEW YORK CITY')).toBe('New York City');
    expect(CapitalizeWords('')).toBe('');
  });

  it('should return input if not a string', () => {
    expect(LowerWords(123 as any)).toBe(123);
    expect(CapitalizeWords(null as any)).toBe(null);
  });
});
