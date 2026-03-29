import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const { market_id, limit = 10 } = await request.json();

    const supabase = getSupabase();

    let query = supabase
      .from("analyses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (market_id) {
      query = query.eq("market_id", market_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    return NextResponse.json({
      count: data?.length || 0,
      analyses: data || [],
    });
  } catch (error) {
    console.error("[query-analyses] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to query analyses",
      },
      { status: 500 }
    );
  }
}
