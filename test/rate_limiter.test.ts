import assert from 'assert';
import {
  MemoryRateLimitStore,
  SharedClusterRateLimitStore,
  ResilientRateLimiter,
  IRateLimitStore,
} from '../src/server/rateLimiter.ts';

console.log('⚡ Running Distributed Rate Limiter & Multi-Instance Suite...\n');

let assertionCount = 0;
function check(condition: boolean, msg: string) {
  assert(condition, msg);
  assertionCount++;
  console.log(`  ✔ ${msg}`);
}

async function runRateLimiterTests() {
  // ================= TEST CASE 1: Basic In-Memory Rate Limiter & Window Expiry =================
  console.log('▶ Test 1: In-Memory Rate Limiting & Window Expiry');

  const memoryStore = new MemoryRateLimitStore(false);
  const testIp = '192.168.1.100';
  const limit = 3;
  const windowMs = 50; // short 50ms window for testing

  const res1 = await memoryStore.incrementAndCheck(testIp, limit, windowMs);
  check(res1.allowed === true && res1.currentCount === 1, 'Request 1/3 allowed');

  const res2 = await memoryStore.incrementAndCheck(testIp, limit, windowMs);
  check(res2.allowed === true && res2.currentCount === 2, 'Request 2/3 allowed');

  const res3 = await memoryStore.incrementAndCheck(testIp, limit, windowMs);
  check(res3.allowed === true && res3.currentCount === 3, 'Request 3/3 allowed (hit limit)');

  const res4 = await memoryStore.incrementAndCheck(testIp, limit, windowMs);
  check(res4.allowed === false && res4.currentCount === 4, 'Request 4/3 blocked (429 condition)');

  // Wait for window to expire
  await new Promise((resolve) => setTimeout(resolve, 60));

  const resAfterExpiry = await memoryStore.incrementAndCheck(testIp, limit, windowMs);
  check(resAfterExpiry.allowed === true && resAfterExpiry.currentCount === 1, 'Request allowed after window reset');

  await memoryStore.close();

  // ================= TEST CASE 2: Multi-Instance Shared Cluster Store =================
  console.log('\n▶ Test 2: Multiple Instances Sharing Quota across Distributed Backend');

  SharedClusterRateLimitStore.clearClusterData();

  // Create three simulated server instances sharing the central cluster backend
  const instanceAlpha = new SharedClusterRateLimitStore('container-pod-alpha');
  const instanceBeta = new SharedClusterRateLimitStore('container-pod-beta');
  const instanceGamma = new SharedClusterRateLimitStore('container-pod-gamma');

  const sharedUserId = 'usr_distributed_shared_42';
  const clusterLimit = 4;
  const clusterWindowMs = 2000;

  // Instance Alpha handles request 1
  const rAlpha1 = await instanceAlpha.incrementAndCheck(sharedUserId, clusterLimit, clusterWindowMs);
  check(rAlpha1.allowed === true && rAlpha1.currentCount === 1, 'Instance Alpha: Request 1/4 counted in shared store');
  check(rAlpha1.isDistributed === true, 'Marked as distributed store execution');

  // Instance Beta handles request 2
  const rBeta1 = await instanceBeta.incrementAndCheck(sharedUserId, clusterLimit, clusterWindowMs);
  check(rBeta1.allowed === true && rBeta1.currentCount === 2, 'Instance Beta: Request 2/4 observed shared increment from Alpha');

  // Instance Gamma handles request 3
  const rGamma1 = await instanceGamma.incrementAndCheck(sharedUserId, clusterLimit, clusterWindowMs);
  check(rGamma1.allowed === true && rGamma1.currentCount === 3, 'Instance Gamma: Request 3/4 observed collective usage');

  // Instance Alpha handles request 4 (hits limit)
  const rAlpha2 = await instanceAlpha.incrementAndCheck(sharedUserId, clusterLimit, clusterWindowMs);
  check(rAlpha2.allowed === true && rAlpha2.currentCount === 4, 'Instance Alpha: Request 4/4 reached maximum quota');

  // Instance Beta handles request 5 (should be blocked distributed-wide)
  const rBeta2 = await instanceBeta.incrementAndCheck(sharedUserId, clusterLimit, clusterWindowMs);
  check(rBeta2.allowed === false && rBeta2.currentCount === 5, 'Instance Beta: Request 5 blocked across cluster boundary');

  // Instance Gamma also blocked
  const rGamma2 = await instanceGamma.incrementAndCheck(sharedUserId, clusterLimit, clusterWindowMs);
  check(rGamma2.allowed === false && rGamma2.currentCount === 6, 'Instance Gamma: Request 6 blocked across cluster boundary');

  // ================= TEST CASE 3: Fail-Safe Degradation Fallback Policy =================
  console.log('\n▶ Test 3: Resilient Safe Fallback When Primary Store Is Unreachable');

  // Faulty store that simulates network partitions or Redis outage
  const faultyStore: IRateLimitStore = {
    async incrementAndCheck() {
      throw new Error('ECONNREFUSED: Connection to shared Redis cluster timed out');
    },
    async reset() {
      throw new Error('ECONNREFUSED');
    },
  };

  const resilientLimiter = new ResilientRateLimiter(faultyStore);

  const fallbackCheck1 = await resilientLimiter.checkLimit('user_fallback_test', 3, 1000);
  check(fallbackCheck1.allowed === true, 'Legitimate request allowed despite primary store outage');
  check(fallbackCheck1.storeType === 'fallback_memory', 'Identified store type as fallback_memory');
  check(resilientLimiter.isUsingFallback() === true, 'Limiter marked active fallback state');

  const fallbackCheck2 = await resilientLimiter.checkLimit('user_fallback_test', 3, 1000);
  check(fallbackCheck2.allowed === true && fallbackCheck2.currentCount === 2, 'Fallback store tracks count locally');

  await resilientLimiter.close();

  console.log(`\n🎉 Rate Limiter Suite Passed! (${assertionCount} assertions verified)\n`);
}

runRateLimiterTests().catch((err) => {
  console.error('Rate Limiter Test Failed:', err);
  process.exit(1);
});
