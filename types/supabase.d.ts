export type Database = {
  public: {
    Tables: {
      user_progress: {
        Row: {
          id: string
          user_id: string
          content_id: string
          progress_percentage: number
          is_completed: boolean
          completed_at?: string
          last_accessed?: string
        }
        Insert: {
          user_id: string
          content_id: string
          progress_percentage: number
          is_completed: boolean
          completed_at?: string
          last_accessed?: string
        }
        Update: {
          progress_percentage?: number
          is_completed?: boolean
          completed_at?: string
          last_accessed?: string
        }
      }
      course_content: {
        Row: any
      }
      user_courses: {
        Row: any
      }
    }
  }
}
