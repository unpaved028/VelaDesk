import { describe, expect, it } from 'vitest';
import { applyTemplate, previewVars } from './templateRender';

describe('previewVars', () => {
  it('uses the tenant brand in the sample ticket', () => {
    const vars = previewVars('Jung IT');
    expect(vars.brand).toBe('Jung IT');
    expect(applyTemplate('{token} {brand}', vars, false)).toBe('[#TK-42] Jung IT');
  });
});
