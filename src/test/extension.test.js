import { describe, expect, it } from 'vitest';
import { calendarDays, filterJobs, groupCounts } from '../utils/extension';
import { createDemoBookings } from '../data/demoBookings';
const jobs = createDemoBookings(new Date(2026, 10, 4));
describe('dashboard and charts', () => {
  it('filters combined keywords and type without mutating input', () => {
    const order = jobs.map((job) => job.id);
    expect(filterJobs(jobs, 'Aroha Apple', 'business', 'date')).toHaveLength(1);
    expect(filterJobs(jobs, 'Aroha', 'consumer', 'date')).toHaveLength(0);
    expect(filterJobs(jobs, 'no match', 'all', 'name')).toHaveLength(0);
    expect(jobs.map((job) => job.id)).toEqual(order);
  });
  it('sorts and aggregates all jobs exactly once', () => {
    const changed = jobs.map((job, index) => ({
      ...job,
      costs: { ...job.costs, totalWithGst: index * 100 },
    }));
    expect(filterJobs(changed, '', 'all', 'cost')[0].id).toBe('sample-7');
    expect(filterJobs(jobs, '', 'all', 'date')[0].repair.repairDate).toBe(
      '2026-11-03',
    );
    expect(filterJobs(jobs, '', 'all', 'newest')[0].id).toBe('sample-7');
    expect(
      groupCounts(jobs, (job) => job.repair.make).reduce(
        (sum, [, count]) => sum + count,
        0,
      ),
    ).toBe(8);
    expect(groupCounts([], (job) => job.repair.make)).toEqual([]);
  });
});
describe('calendar', () => {
  it('creates a Monday-first grid across year boundaries', () => {
    const days = calendarDays(new Date(2027, 0, 1));
    expect(days).toHaveLength(42);
    expect(days[0].key).toBe('2026-12-28');
    expect(days.filter((day) => day.current)).toHaveLength(31);
    expect(new Set(days.map((day) => day.key)).size).toBe(42);
  });
  it('handles leap February', () =>
    expect(
      calendarDays(new Date(2028, 1, 1)).filter((day) => day.current),
    ).toHaveLength(29));
});
