import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const { market_id, market_title, signal, market_data } =
      await request.json();

    if (!market_id || !market_title || !signal) {
      return NextResponse.json(
        { error: "market_id, market_title, and signal are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("analyses")
      .insert({
        market_id,
        market_title,
        signal,
        market_data: market_data || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      created_at: data.created_at,
    });
  } catch (error) {
    console.error("[store-analysis] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to store analysis",
      },
      { status: 500 }
    );
  }
}
