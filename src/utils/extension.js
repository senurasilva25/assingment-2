import { dateKey } from './booking';

export function filterJobs(jobs, search, type, sort) {
  const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return jobs
    .filter((job) => {
      const text = [
        job.job_number,
        job.customer.firstName,
        job.customer.lastName,
        job.repair.make,
        job.repair.fault,
        job.repair.repairDate,
      ]
        .join(' ')
        .toLowerCase();
      return (
        (type === 'all' || job.customer.customerType === type) &&
        terms.every((term) => text.includes(term))
      );
    })
    .sort((a, b) =>
      sort === 'name'
        ? `${a.customer.lastName} ${a.customer.firstName}`.localeCompare(
            `${b.customer.lastName} ${b.customer.firstName}`,
          )
        : sort === 'cost'
          ? b.costs.totalWithGst - a.costs.totalWithGst
          : sort === 'newest'
            ? new Date(b.created_at) - new Date(a.created_at)
            : `${a.repair.repairDate}T${a.repair.repairTime}`.localeCompare(
                `${b.repair.repairDate}T${b.repair.repairTime}`,
              ),
    );
}

export function groupCounts(jobs, getKey) {
  return Object.entries(
    jobs.reduce((counts, job) => {
      const key = getKey(job) || 'Other';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
}

export function calendarDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first);
    date.setDate(1 - offset + index);
    return {
      key: dateKey(date),
      day: date.getDate(),
      current: date.getMonth() === month.getMonth(),
    };
  });
}
