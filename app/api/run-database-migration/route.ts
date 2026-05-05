import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    // Get the migration file name from the request
    const { fileName } = await request.json()

    if (!fileName) {
      return NextResponse.json({ error: "No file name provided" }, { status: 400 })
    }

    // Construct the path to the migration file
    const filePath = path.join(process.cwd(), "db", fileName)

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `File ${fileName} not found` }, { status: 404 })
    }

    // Read the SQL file
    const sql = fs.readFileSync(filePath, "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: `Migration failed: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Migration ${fileName} executed successfully` })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}
