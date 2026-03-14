import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { recipes, recipeSourceTypeEnum } from './recipes';

// Ingestion job status enum
export const ingestionJobStatusEnum = pgEnum('ingestion_job_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

// Artifact type enum
export const artifactTypeEnum = pgEnum('artifact_type', [
  'source_media',
  'ocr_result',
  'transcript',
  'extracted_draft',
  'normalized_recipe',
]);

// Ingestion jobs
export const ingestionJobs = pgTable('ingestion_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  sourceType: recipeSourceTypeEnum('source_type').notNull(),
  sourceUrl: text('source_url'),
  sourceMediaId: text('source_media_id'),
  status: ingestionJobStatusEnum('status').notNull().default('pending'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Ingestion artifacts
export const ingestionArtifacts = pgTable('ingestion_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id')
    .notNull()
    .references(() => ingestionJobs.id, { onDelete: 'cascade' }),
  artifactType: artifactTypeEnum('artifact_type').notNull(),
  content: text('content'),
  storageUrl: text('storage_url'),
  metadata: text('metadata'), // JSON stored as text
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
