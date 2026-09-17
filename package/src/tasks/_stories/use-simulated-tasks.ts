import { useEffect, useState } from 'react';
import { createTaskFixtures } from '../fixtures';
import type { BackgroundTask } from '../types';

const LOG_LINES = [
  'GET /api/invoices 200 in 41ms',
  'POST /api/invoices/draft 201 in 88ms',
  'GET /api/customers?page=2 200 in 57ms',
  'compiled client and server successfully in 1.2s',
];

function mapTask(
  tasks: BackgroundTask[],
  id: string,
  update: (task: BackgroundTask) => BackgroundTask
): BackgroundTask[] {
  return tasks.map((task) => {
    if (task.id === id) {
      return update(task);
    }
    return task.children ? { ...task, children: mapTask(task.children, id, update) } : task;
  });
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useSimulatedTasks() {
  const [tasks, setTasks] = useState(() => createTaskFixtures());

  useEffect(() => {
    let tick = 0;
    const id = window.setInterval(() => {
      tick++;
      const line = LOG_LINES[tick % LOG_LINES.length];
      setTasks((current) =>
        mapTask(
          mapTask(current, 'dev-server', (task) => ({
            ...task,
            lastActivity: line,
            output: `${task.output ?? ''}\n${line}`,
          })),
          'review-agent',
          (task) => ({
            ...task,
            tokens: (task.tokens ?? 0) + 420,
            toolUses: (task.toolUses ?? 0) + (tick % 3 === 0 ? 1 : 0),
          })
        )
      );
    }, 1200);
    return () => window.clearInterval(id);
  }, []);

  const stop = async (target: BackgroundTask) => {
    await wait(600);
    setTasks((current) =>
      mapTask(current, target.id, (task) => ({
        ...task,
        status: 'cancelled',
        endedAt: Date.now(),
        lastActivity: 'Stopped by the user',
      }))
    );
  };

  const retry = async (target: BackgroundTask) => {
    await wait(600);
    setTasks((current) =>
      mapTask(current, target.id, (task) => ({
        ...task,
        status: 'running',
        startedAt: Date.now(),
        endedAt: undefined,
        error: undefined,
        lastActivity: 'Restarted',
      }))
    );
  };

  const remove = (target: BackgroundTask) => {
    setTasks((current) => current.filter((task) => task.id !== target.id));
  };

  const steer = async (taskId: string, text: string) => {
    await wait(700);
    if (/fail/i.test(text)) {
      throw new Error('The agent rejected the instruction');
    }
    setTasks((current) =>
      mapTask(current, taskId, (task) => ({
        ...task,
        lastActivity: `Instruction received: ${text}`,
        messages: [
          ...(task.messages ?? []),
          {
            id: `steer-${Date.now()}`,
            from: { name: 'you', color: 'blue' },
            to: task.owner,
            summary: text,
            timestamp: Date.now(),
          },
        ],
      }))
    );
  };

  return { tasks, stop, retry, remove, steer };
}
