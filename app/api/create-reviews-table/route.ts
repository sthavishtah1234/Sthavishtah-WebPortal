import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Check if the reviews table exists
    const { data: tableExists, error: checkError } = await supabase.from("reviews").select("id").limit(1).maybeSingle()

    if (checkError && checkError.code === "42P01") {
      // Table doesn't exist
      // Create the reviews table
      const { error: createError } = await supabase.rpc("create_reviews_table")

      if (createError) {
        // Try direct SQL if RPC fails
        const { error: sqlError } = await supabase.query(`
          CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            avatar_url TEXT,
            rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
            review_text TEXT NOT NULL,
            is_featured BOOLEAN DEFAULT false,
            is_published BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `)

        if (sqlError) {
          return NextResponse.json(
            {
              success: false,
              message: "Failed to create reviews table",
              error: sqlError,
            },
            { status: 500 },
          )
        }
      }

      // Add sample reviews
      const { error: insertError } = await supabase.from("reviews").insert([
        {
          name: "Priya Sharma",
          rating: 5,
          review_text:
            "The yoga sessions have transformed my daily routine. I feel more energetic and focused throughout the day.",
          is_featured: true,
        },
        {
          name: "Rahul Patel",
          rating: 5,
          review_text:
            "The instructors are excellent and the course content is well-structured. Highly recommended for beginners!",
          is_featured: false,
        },
        {
          name: "Ananya Desai",
          rating: 4,
          review_text:
            "I've been practicing yoga for years, but these sessions taught me new techniques that have improved my practice.",
          is_featured: false,
        },
      ])

      if (insertError) {
        return NextResponse.json(
          {
            success: true,
            message: "Reviews table created but failed to add sample data",
            error: insertError,
          },
          { status: 201 },
        )
      }

      return NextResponse.json(
        {
          success: true,
          message: "Reviews table created and sample data added",
        },
        { status: 201 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Reviews table already exists",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error checking/creating reviews table:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to check/create reviews table",
        error,
      },
      { status: 500 },
    )
  }
}
