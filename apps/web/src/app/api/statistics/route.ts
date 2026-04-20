import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLaundryRepository } from '@laundry/data';
import {
  buildStatisticsResponse,
  normalizeStatisticsTypeFilter,
  type StatisticsFilters,
  type StatisticsResponse,
} from '@laundry/domain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice('Bearer '.length).trim() || null;
}

function parseFilters(request: NextRequest): StatisticsFilters {
  const startDate = request.nextUrl.searchParams.get('startDate');
  const endDate = request.nextUrl.searchParams.get('endDate');
  const typeFilter = normalizeStatisticsTypeFilter(request.nextUrl.searchParams.get('typeFilter'));

  if (!startDate || !endDate) {
    throw new Error('startDate and endDate are required.');
  }

  return { startDate, endDate, typeFilter };
}

function coerceResponse(value: unknown, filters: StatisticsFilters): StatisticsResponse {
  const input = (value ?? {}) as Partial<StatisticsResponse> & {
    summary?: { totalValue?: number | string; recordCount?: number | string };
  };

  return {
    filters,
    summary: {
      totalValue: Number(input.summary?.totalValue ?? 0),
      recordCount: Number(input.summary?.recordCount ?? 0),
    },
    costByCategory: Array.isArray(input.costByCategory) ? input.costByCategory.map((item) => ({
      name: String(item.name),
      value: Number(item.value ?? 0),
    })) : [],
    volumeByCategory: Array.isArray(input.volumeByCategory) ? input.volumeByCategory.map((item) => ({
      name: String(item.name),
      value: Number(item.value ?? 0),
    })) : [],
    trendByDay: Array.isArray(input.trendByDay) ? input.trendByDay.map((item) => ({
      date: String(item.date),
      value: Number(item.value ?? 0),
    })) : [],
  };
}

export async function GET(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let filters: StatisticsFilters;
  try {
    filters = parseFilters(request);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid filters' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase web environment variables are missing.' }, { status: 500 });
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase.rpc('get_statistics_aggregates', {
      start_date: filters.startDate,
      end_date: filters.endDate,
      type_filter: filters.typeFilter,
    });

    if (!error && data) {
      return NextResponse.json(coerceResponse(data, filters));
    }

    const repository = createLaundryRepository(supabase, { throwOnReadError: true });
    const records = await repository.getHistory(filters.startDate, filters.endDate, filters.typeFilter);
    return NextResponse.json(buildStatisticsResponse(records, filters));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load statistics.' },
      { status: 500 },
    );
  }
}
