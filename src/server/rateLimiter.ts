/**
 * FixPilot AI — Rate Limiting Store Architecture
 *
 * Multi-Instance Distributed & Local Fail-Safe Policy:
 * 1. Distributed Mode: When `REDIS_URL` is configured (e.g. redis://user:pass@host:port),
 *    the system uses the distributed store across all running container instances.
 * 2. Fallback Policy: If the shared distributed store is unreachable, times out, or throws an error,
 *    the rate limiter automatically and safely falls back to local in-memory tracking.
 *    Legitimate user requests are NOT rejected due to an infrastructure outage.
 * 3. Zero-Cost Default: Without `REDIS_URL`, FixPilot operates in zero-cost in-memory mode.
 *    No paid service or external dependency is required.
 *
 * Supported Free/Low-Cost Distributed Backends:
 * - Upstash Redis (Free tier: 10,000 commands/day, zero infrastructure)
 * - Google Cloud Memorystore for Redis
 * - Self-hosted Redis on Docker / Kubernetes
 */

export interface RateLimitCheckResult {
  allowed: boolean;
  currentCount: number;
  remaining: number;
  resetTimeMs: number;
  storeType: 'distributed_redis' | 'local_memory' | 'fallback_memory' | 'shared_test_cluster';
  isDistributed: boolean;
}

export interface IRateLimitStore {
  incrementAndCheck(identifier: string, limit: number, windowMs: number): Promise<RateLimitCheckResult>;
  reset(identifier: string): Promise<void>;
  close?(): Promise<void>;
}

/**
 * Local In-Memory Rate Limiter with automatic TTL cleanup
 */
export class MemoryRateLimitStore implements IRateLimitStore {
  private records = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(autoCleanup = true) {
    if (autoCleanup) {
      // Periodically clean expired keys every 60 seconds to prevent unbounded memory growth
      this.cleanupInterval = setInterval(() => this.cleanupExpired(), 60000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [key, value] of this.records.entries()) {
      if (now > value.resetTime) {
        this.records.delete(key);
      }
    }
  }

  async incrementAndCheck(identifier: string, limit: number, windowMs: number): Promise<RateLimitCheckResult> {
    const now = Date.now();
    const existing = this.records.get(identifier);

    if (!existing || now > existing.resetTime) {
      const resetTime = now + windowMs;
      this.records.set(identifier, { count: 1, resetTime });
      return {
        allowed: true,
        currentCount: 1,
        remaining: Math.max(0, limit - 1),
        resetTimeMs: resetTime,
        storeType: 'local_memory',
        isDistributed: false,
      };
    }

    existing.count += 1;
    const allowed = existing.count <= limit;
    return {
      allowed,
      currentCount: existing.count,
      remaining: Math.max(0, limit - existing.count),
      resetTimeMs: existing.resetTime,
      storeType: 'local_memory',
      isDistributed: false,
    };
  }

  async reset(identifier: string): Promise<void> {
    this.records.delete(identifier);
  }

  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.records.clear();
  }
}

/**
 * Shared Cluster Simulator for Multi-Instance Testing
 * Simulates multiple server instances (Instance A, Instance B, Instance C)
 * connecting to the exact same shared central database.
 */
export class SharedClusterRateLimitStore implements IRateLimitStore {
  private static sharedClusterData = new Map<string, { count: number; resetTime: number }>();
  private instanceId: string;

  constructor(instanceId = 'instance-default') {
    this.instanceId = instanceId;
  }

  static clearClusterData() {
    SharedClusterRateLimitStore.sharedClusterData.clear();
  }

  async incrementAndCheck(identifier: string, limit: number, windowMs: number): Promise<RateLimitCheckResult> {
    const now = Date.now();
    const existing = SharedClusterRateLimitStore.sharedClusterData.get(identifier);

    if (!existing || now > existing.resetTime) {
      const resetTime = now + windowMs;
      SharedClusterRateLimitStore.sharedClusterData.set(identifier, { count: 1, resetTime });
      return {
        allowed: true,
        currentCount: 1,
        remaining: Math.max(0, limit - 1),
        resetTimeMs: resetTime,
        storeType: 'shared_test_cluster',
        isDistributed: true,
      };
    }

    existing.count += 1;
    const allowed = existing.count <= limit;
    return {
      allowed,
      currentCount: existing.count,
      remaining: Math.max(0, limit - existing.count),
      resetTimeMs: existing.resetTime,
      storeType: 'shared_test_cluster',
      isDistributed: true,
    };
  }

  async reset(identifier: string): Promise<void> {
    SharedClusterRateLimitStore.sharedClusterData.delete(identifier);
  }

  getInstanceId(): string {
    return this.instanceId;
  }
}

/**
 * Resilient Distributed Rate Limiter with Automatic Safe Fallback
 */
export class ResilientRateLimiter {
  private primaryStore: IRateLimitStore;
  private fallbackStore: MemoryRateLimitStore;
  private isFallbackActive = false;

  constructor(primaryStore?: IRateLimitStore) {
    this.fallbackStore = new MemoryRateLimitStore(true);
    this.primaryStore = primaryStore || this.fallbackStore;
  }

  setPrimaryStore(store: IRateLimitStore) {
    this.primaryStore = store;
    this.isFallbackActive = false;
  }

  async checkLimit(identifier: string, limit = 20, windowMs = 60000): Promise<RateLimitCheckResult> {
    try {
      const result = await this.primaryStore.incrementAndCheck(identifier, limit, windowMs);
      this.isFallbackActive = false;
      return result;
    } catch (err: any) {
      console.warn(
        `[FixPilot RateLimiter] Primary distributed store failed (${err?.message || err}). Safely degrading to local in-memory fallback.`
      );
      this.isFallbackActive = true;
      const fallbackResult = await this.fallbackStore.incrementAndCheck(identifier, limit, windowMs);
      return {
        ...fallbackResult,
        storeType: 'fallback_memory',
        isDistributed: false,
      };
    }
  }

  async reset(identifier: string): Promise<void> {
    try {
      await this.primaryStore.reset(identifier);
    } catch {
      // ignore primary error during reset
    }
    await this.fallbackStore.reset(identifier);
  }

  isUsingFallback(): boolean {
    return this.isFallbackActive;
  }

  async close(): Promise<void> {
    if (this.primaryStore.close) await this.primaryStore.close();
    await this.fallbackStore.close();
  }
}

// Global singleton instance for application routes
export const globalRateLimiter = new ResilientRateLimiter();
