import { Worker } from 'bullmq';
import { processMealPlan } from './processors/meal-plan';
import { processShoppingList } from './processors/shopping-list';
import { processSubstitution } from './processors/substitution';

const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');
const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  maxRetriesPerRequest: null,
};

// Meal plan expansion worker
const mealPlanWorker = new Worker(
  'meal-plan',
  async (job) => {
    console.log(`Processing meal plan job ${job.id}:`, job.data);
    return processMealPlan(job.data);
  },
  { connection }
);

// Shopping list generation worker
const shoppingListWorker = new Worker(
  'shopping-list',
  async (job) => {
    console.log(`Processing shopping list job ${job.id}:`, job.data);
    return processShoppingList(job.data);
  },
  { connection }
);

// Substitution suggestions worker
const substitutionWorker = new Worker(
  'substitution',
  async (job) => {
    console.log(`Processing substitution job ${job.id}:`, job.data);
    return processSubstitution(job.data);
  },
  { connection }
);

// Error handling
const workers = [mealPlanWorker, shoppingListWorker, substitutionWorker];

for (const worker of workers) {
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });
}

console.log('Domain worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down domain worker...');
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
});
