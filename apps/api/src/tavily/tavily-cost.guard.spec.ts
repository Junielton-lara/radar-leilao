import { TavilyService } from './tavily.service';

describe('Tavily cost guard', () => {
  it('blocks when daily limit would be exceeded', () => {
    expect(
      TavilyService.shouldBlockByLimit({
        dailyLimit: 10,
        monthlyLimit: 100,
        dailyUsed: 9,
        monthlyUsed: 9,
        needed: 2,
      }),
    ).toBe(true);
  });

  it('allows when within daily and monthly limits', () => {
    expect(
      TavilyService.shouldBlockByLimit({
        dailyLimit: 10,
        monthlyLimit: 100,
        dailyUsed: 5,
        monthlyUsed: 20,
        needed: 2,
      }),
    ).toBe(false);
  });

  it('blocks when disabledByLimit flag is set', () => {
    expect(
      TavilyService.shouldBlockByLimit({
        dailyLimit: 0,
        monthlyLimit: 0,
        dailyUsed: 0,
        monthlyUsed: 0,
        needed: 1,
        disabledByLimit: true,
      }),
    ).toBe(true);
  });

  it('treats limit 0 as unlimited', () => {
    expect(
      TavilyService.shouldBlockByLimit({
        dailyLimit: 0,
        monthlyLimit: 0,
        dailyUsed: 999,
        monthlyUsed: 999,
        needed: 50,
      }),
    ).toBe(false);
  });
});
