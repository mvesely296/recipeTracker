import { NextResponse } from 'next/server';
import { isNotNull } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { ingredientCatalog } from '@recipe-tracker/db';
import { handleError } from '@/lib/api/response';

export async function GET() {
  try {
    const db = getDb();

    const rows = await db
      .select({
        name: ingredientCatalog.name,
        aliases: ingredientCatalog.aliases,
        gramsPerCup: ingredientCatalog.gramsPerCup,
      })
      .from(ingredientCatalog)
      .where(isNotNull(ingredientCatalog.gramsPerCup));

    // Build flat map: name → gramsPerCup, plus each alias → gramsPerCup
    const densities: Record<string, number> = {};
    for (const row of rows) {
      if (row.gramsPerCup == null) continue;
      densities[row.name.toLowerCase()] = row.gramsPerCup;
      if (row.aliases) {
        for (const alias of row.aliases) {
          densities[alias.toLowerCase()] = row.gramsPerCup;
        }
      }
    }

    return NextResponse.json({ success: true, data: densities });
  } catch (error) {
    return handleError(error);
  }
}
