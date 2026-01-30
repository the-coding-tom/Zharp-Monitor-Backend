import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  EMAIL_NOTIFICATION_QUEUE,
  PUSH_NOTIFICATION_QUEUE,
  WHATSAPP_NOTIFICATION_QUEUE,
  STRIPE_CHECKOUT_QUEUE,
} from '../../common/constants/queues.constant';
import { config } from '../../config/config';

interface CleanupStats {
  queueName: string;
  completedRemoved: number;
  failedRemoved: number;
}

interface RedisMemoryInfo {
  usedMemory: number;
  maxMemory: number;
  usedMemoryPercent: number;
}

/**
 * Prevents Redis memory bloat from unconsumed or stalled Bull queue data.
 *
 * @remarks
 * - Hourly: removes old completed/failed jobs (Bull's removeOnComplete/removeOnFail can leave gaps under load).
 * - Every 6h: removes jobs stuck in "active" (e.g. worker died) so they don't sit in Redis forever.
 * - Every 10min: logs queue counts and Redis memory; triggers aggressive cleanup when usage exceeds threshold.
 */
@Injectable()
export class QueueCleanupCron {
  private readonly logger = new Logger(QueueCleanupCron.name);
  private readonly queues: Queue[] = [];

  private isHourlyCleanupRunning = false;
  private isStuckJobsCleanupRunning = false;
  private isMonitoringRunning = false;

  constructor(
    @InjectQueue(EMAIL_NOTIFICATION_QUEUE) private readonly emailQueue: Queue,
    @InjectQueue(PUSH_NOTIFICATION_QUEUE) private readonly pushQueue: Queue,
    @InjectQueue(WHATSAPP_NOTIFICATION_QUEUE) private readonly whatsappQueue: Queue,
    @InjectQueue(STRIPE_CHECKOUT_QUEUE) private readonly stripeCheckoutQueue: Queue,
  ) {
    this.queues = [
      this.emailQueue,
      this.pushQueue,
      this.whatsappQueue,
      this.stripeCheckoutQueue,
    ];
    this.logger.log(`QueueCleanupCron initialized with ${this.queues.length} queues`);
  }

  /**
   * Hourly cleanup of completed and failed jobs.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyCleanup() {
    if (this.isHourlyCleanupRunning) {
      this.logger.debug('Previous hourly cleanup still running. Skipping this run.');
      return;
    }

    this.isHourlyCleanupRunning = true;
    this.logger.log('Starting hourly queue cleanup');

    try {
      const allStats: CleanupStats[] = [];

      for (const queue of this.queues) {
        const stats = await this.cleanupQueue(queue);
        allStats.push(stats);
      }

      const totalCompleted = allStats.reduce((sum, s) => sum + s.completedRemoved, 0);
      const totalFailed = allStats.reduce((sum, s) => sum + s.failedRemoved, 0);

      if (totalCompleted > 0 || totalFailed > 0) {
        this.logger.log(
          `Hourly cleanup completed: removed ${totalCompleted} completed jobs, ${totalFailed} failed jobs across ${this.queues.length} queues`,
        );
      } else {
        this.logger.debug('Hourly cleanup completed: no jobs removed');
      }
    } catch (error) {
      this.logger.error(
        `Hourly cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.isHourlyCleanupRunning = false;
    }
  }

  /**
   * Cleanup stuck active jobs every 6 hours.
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleStuckJobsCleanup() {
    if (this.isStuckJobsCleanupRunning) {
      this.logger.debug('Previous stuck jobs cleanup still running. Skipping this run.');
      return;
    }

    this.isStuckJobsCleanupRunning = true;
    this.logger.log('Starting stuck active jobs cleanup');

    try {
      let totalStuckJobsRemoved = 0;

      for (const queue of this.queues) {
        const removedCount = await this.cleanupStuckActiveJobs(queue);
        totalStuckJobsRemoved += removedCount;
      }

      if (totalStuckJobsRemoved > 0) {
        this.logger.log(
          `Stuck jobs cleanup completed: removed ${totalStuckJobsRemoved} stuck active jobs`,
        );
      } else {
        this.logger.debug('Stuck jobs cleanup completed: no stuck jobs found');
      }
    } catch (error) {
      this.logger.error(
        `Stuck jobs cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.isStuckJobsCleanupRunning = false;
    }
  }

  /**
   * Monitor Redis memory and queue health every 10 minutes.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleMonitoring() {
    if (this.isMonitoringRunning) {
      this.logger.debug('Previous monitoring run still active. Skipping this run.');
      return;
    }

    this.isMonitoringRunning = true;

    try {
      const memoryInfo = await this.getRedisMemoryInfo();
      const queueStats = await this.getQueueStatistics();

      const memoryDisplay =
        memoryInfo.maxMemory > 0
          ? `${(memoryInfo.usedMemory / 1024 / 1024).toFixed(2)} MB / ${(memoryInfo.maxMemory / 1024 / 1024).toFixed(2)} MB (${memoryInfo.usedMemoryPercent.toFixed(1)}%)`
          : `${(memoryInfo.usedMemory / 1024 / 1024).toFixed(2)} MB (no limit set)`;

      this.logger.log(`Redis memory: ${memoryDisplay}`);
      this.logger.log(
        `Queue totals - Waiting: ${queueStats.totalWaiting}, Active: ${queueStats.totalActive}, Completed: ${queueStats.totalCompleted}, Failed: ${queueStats.totalFailed}, Delayed: ${queueStats.totalDelayed}`,
      );

      if (queueStats.totalWaiting + queueStats.totalActive + queueStats.totalCompleted
          + queueStats.totalFailed + queueStats.totalDelayed > 10000) {
        this.logger.warn('High total job count across queues', queueStats as object);
      }

      if (memoryInfo.usedMemoryPercent >= config.queueCleanup.redisMemoryCriticalPercent) {
        this.logger.error(
          `Redis memory critical (${memoryInfo.usedMemoryPercent.toFixed(1)}%) - triggering aggressive cleanup`,
        );
        await this.aggressiveCleanup();
      } else if (memoryInfo.usedMemoryPercent >= config.queueCleanup.redisMemoryWarnPercent) {
        this.logger.warn(
          `Redis memory warning: ${memoryInfo.usedMemoryPercent.toFixed(1)}%`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      this.isMonitoringRunning = false;
    }
  }

  /**
   * Clean up a single queue's completed and failed jobs.
   */
  private async cleanupQueue(queue: Queue): Promise<CleanupStats> {
    const stats: CleanupStats = {
      queueName: queue.name,
      completedRemoved: 0,
      failedRemoved: 0,
    };

    try {
      const completedRemoved = await queue.clean(
        config.queueCleanup.completedCleanAgeMs,
        'completed',
      );
      stats.completedRemoved = completedRemoved.length;

      const failedRemoved = await queue.clean(
        config.queueCleanup.failedCleanAgeMs,
        'failed',
      );
      stats.failedRemoved = failedRemoved.length;
    } catch (error) {
      this.logger.error(
        `Failed to cleanup queue ${queue.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return stats;
  }

  /**
   * Clean up stuck active jobs that have been running too long.
   */
  private async cleanupStuckActiveJobs(queue: Queue): Promise<number> {
    let removedCount = 0;

    try {
      const activeJobs = await queue.getJobs(['active'], 0, -1);
      const now = Date.now();

      for (const job of activeJobs) {
        const age = now - job.timestamp;
        if (age > config.queueCleanup.stuckActiveAgeMs) {
          this.logger.warn(
            `Removing stuck active job ${job.id} in queue ${queue.name} (age: ${Math.round(age / 1000 / 60)} minutes)`,
          );
          await job.remove();
          removedCount += 1;
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to cleanup stuck jobs in queue ${queue.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return removedCount;
  }

  /**
   * Get Redis memory information using the first queue's client.
   */
  private async getRedisMemoryInfo(): Promise<RedisMemoryInfo> {
    try {
      const client = this.emailQueue.client;
      const info = await client.info('memory');
      const lines = info.split(/\r?\n/);

      let usedMemory = 0;
      let maxMemory = 0;

      for (const line of lines) {
        if (line.startsWith('used_memory:')) {
          usedMemory = parseInt(line.slice('used_memory:'.length), 10);
        }
        if (line.startsWith('maxmemory:')) {
          maxMemory = parseInt(line.slice('maxmemory:'.length), 10);
        }
      }

      const usedMemoryPercent = maxMemory > 0 ? (usedMemory / maxMemory) * 100 : 0;
      return { usedMemory, maxMemory, usedMemoryPercent };
    } catch (error) {
      this.logger.error(
        `Failed to get Redis memory info: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return { usedMemory: 0, maxMemory: 0, usedMemoryPercent: 0 };
    }
  }

  /**
   * Get aggregated statistics across all queues.
   */
  private async getQueueStatistics(): Promise<{
    totalWaiting: number;
    totalActive: number;
    totalCompleted: number;
    totalFailed: number;
    totalDelayed: number;
  }> {
    let totalWaiting = 0;
    let totalActive = 0;
    let totalCompleted = 0;
    let totalFailed = 0;
    let totalDelayed = 0;

    for (const queue of this.queues) {
      try {
        const counts = await queue.getJobCounts();
        totalWaiting += counts.waiting ?? 0;
        totalActive += counts.active ?? 0;
        totalCompleted += counts.completed ?? 0;
        totalFailed += counts.failed ?? 0;
        totalDelayed += counts.delayed ?? 0;
      } catch (error) {
        this.logger.error(
          `Failed to get counts for queue ${queue.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return { totalWaiting, totalActive, totalCompleted, totalFailed, totalDelayed };
  }

  /**
   * Shorter retention when Redis memory is critical; reclaims memory quickly.
   */
  private async aggressiveCleanup() {
    this.logger.warn('Running aggressive queue cleanup due to high Redis memory');

    const completedAgeMs = 10 * 60 * 1000;
    const failedAgeMs = 60 * 60 * 1000;
    const activeAgeMs = 30 * 60 * 1000;

    for (const queue of this.queues) {
      try {
        await queue.clean(completedAgeMs, 'completed');
        await queue.clean(failedAgeMs, 'failed');
        await queue.clean(activeAgeMs, 'active');
        this.logger.log(`Aggressive cleanup completed for ${queue.name}`);
      } catch (error) {
        this.logger.error(
          `Aggressive cleanup failed for ${queue.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
  }
}
