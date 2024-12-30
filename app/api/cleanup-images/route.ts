import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

interface User {
  id: string
  user_metadata: {
    avatar_url?: string
  }
}

interface StorageFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: Record<string, any>
}

export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )

    // Get all files in the user-images bucket
    const { data: files, error: filesError } = await supabase
      .storage
      .from('user-images')
      .list()

    if (filesError) {
      throw filesError
    }

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, user_metadata')

    if (usersError) {
      throw usersError
    }

    // Create a set of valid image paths from user metadata
    const validImagePaths = new Set(
      (users as User[])
        .map(user => user.user_metadata?.avatar_url)
        .filter((url): url is string => typeof url === 'string')
        .map(url => {
          const parts = url.split('/')
          return parts[parts.length - 1]
        })
    )

    // Find orphaned files
    const orphanedFiles = (files as StorageFile[])
      .filter(file => !validImagePaths.has(file.name))
      .map(file => file.name)

    // Delete orphaned files
    if (orphanedFiles.length > 0) {
      const { error: deleteError } = await supabase
        .storage
        .from('user-images')
        .remove(orphanedFiles)

      if (deleteError) {
        throw deleteError
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: orphanedFiles.length,
      deletedFiles: orphanedFiles
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 