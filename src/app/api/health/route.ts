import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("recipes")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "ok",
      supabase: "connected",
      recipes_count_sample: data.length,
    });
  } catch (e) {
    return NextResponse.json(
      { status: "error", message: String(e) },
      { status: 500 }
    );
  }
}
