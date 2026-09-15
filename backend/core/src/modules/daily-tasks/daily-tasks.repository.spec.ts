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

  it('scopes lookup and update to the authenticated user and linked task owner', async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: 3 });
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const repository = new DailyTasksRepository({
      daily_tasks: { findFirst, updateMany },
    } as never);

    await repository.findDailyTaskForUser(3, 7);
    await repository.updateDailyTasks(
      {
        dailyTaskId: 3,
        status: 'COMPLETED',
        completedAt: '2026-09-15T09:30:00.000Z',
      },
      7,
    );

    const where = {
      id: 3,
      user_id: 7,
      OR: [{ task_id: null }, { task: { is: { user_id: 7 } } }],
    };
    expect(findFirst).toHaveBeenCalledWith({ where, include: { task: true } });
    expect(updateMany).toHaveBeenCalledWith({
      where,
      data: {
        status: 'COMPLETED',
        completed_at: new Date('2026-09-15T09:30:00.000Z'),
      },
    });
  });

  it('clears the completion timestamp when restoring a task to pending', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findFirst = jest.fn().mockResolvedValue({ id: 3, status: 'PENDING' });
    const repository = new DailyTasksRepository({
      daily_tasks: { updateMany, findFirst },
    } as never);

    await repository.updateDailyTasks(
      { dailyTaskId: 3, status: 'PENDING', completedAt: null },
      7,
    );

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'PENDING', completed_at: null },
      }),
    );
  });
});
