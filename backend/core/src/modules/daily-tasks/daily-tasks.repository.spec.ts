import { DailyTasksRepository } from './daily-tasks.repository';

describe('DailyTasksRepository', () => {
  it('scopes results to the user and excludes the next day boundary', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const repository = new DailyTasksRepository({
      daily_tasks: { findMany },
    } as never);

    await repository.getDailyTasks(7, '2026-09-12');

    expect(findMany).toHaveBeenCalledWith({
      where: {
        user_id: 7,
        OR: [{ task_id: null }, { task: { is: { user_id: 7 } } }],
        task_date: {
          gte: new Date('2026-09-12T00:00:00.000Z'),
          lt: new Date('2026-09-13T00:00:00.000Z'),
        },
      },
      include: { task: true },
    });
  });
});
