import { renderHook } from '@testing-library/react-hooks/dom';
import { useTrialStatus } from '../hooks/useTrialStatus';
import { useFeatureFlag } from '../code/trial-implementation';
import { describe, test, expect } from '@jest/globals';

describe('Trial System', () => {
  test('useTrialStatus hook', () => {
    const { result } = renderHook(() => useTrialStatus());
    expect(result.current).toBeDefined();
  });

  test('feature flag system', () => {
    const { result } = renderHook(() => useFeatureFlag('30_day_trial'));
    expect(typeof result.current).toBe('boolean');
  });
});