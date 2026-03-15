'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Tabs, TabPanel } from '@recipe-tracker/ui';
import { ManualRecipeForm } from '@/components/recipes/ManualRecipeForm';
import { ImportRecipeForm } from '@/components/recipes/ImportRecipeForm';

const tabs = [
  { key: 'manual', label: 'Enter Manually' },
  { key: 'import', label: 'Import from URL' },
];

export default function NewRecipePage() {
  const [activeTab, setActiveTab] = useState('manual');

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={"/recipes" as any} className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 mb-4 inline-block">
        &larr; Back to Recipes
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Add Recipe</h1>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />

      <TabPanel active={activeTab === 'manual'}>
        <ManualRecipeForm />
      </TabPanel>

      <TabPanel active={activeTab === 'import'}>
        <ImportRecipeForm />
      </TabPanel>
    </div>
  );
}
