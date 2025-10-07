import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Helper function to get user from authorization header
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify token and get user
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return null;
    }

    // Get user from database
    const result = await query(
      `SELECT id, email, first_name, last_name
       FROM users
       WHERE id = $1`,
      [decoded.userId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// GET - Fetch article content for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Verify project belongs to user
    const projectCheck = await query(
      `SELECT p.id FROM projects p
       WHERE p.id = $1 AND p.user_id = $2`,
      [projectId, user.id]
    );

    if (projectCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get article
    const result = await query(
      `SELECT id, project_id, content, word_count, 
              auto_save_timestamp, manual_save_timestamp
       FROM articles
       WHERE project_id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      // Create empty article if doesn't exist
      const insertResult = await query(
        `INSERT INTO articles (project_id, content, word_count)
         VALUES ($1, '', 0)
         RETURNING id, project_id, content, word_count, 
                   auto_save_timestamp, manual_save_timestamp`,
        [projectId]
      );
      
      return NextResponse.json({ article: insertResult.rows[0] });
    }

    return NextResponse.json({ article: result.rows[0] });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

// PUT - Update article content
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const { content, word_count, auto_save } = body;

    // Verify project belongs to user
    const projectCheck = await query(
      `SELECT p.id FROM projects p
       WHERE p.id = $1 AND p.user_id = $2`,
      [projectId, user.id]
    );

    if (projectCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if article exists
    const existingArticle = await query(
      'SELECT id FROM articles WHERE project_id = $1',
      [projectId]
    );

    let result;

    if (existingArticle.rows.length === 0) {
      // Create new article
      const timestampField = auto_save ? 'auto_save_timestamp' : 'manual_save_timestamp';
      result = await query(
        `INSERT INTO articles (project_id, content, word_count, ${timestampField})
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         RETURNING id, project_id, content, word_count, 
                   auto_save_timestamp, manual_save_timestamp`,
        [projectId, content, word_count]
      );
    } else {
      // Update existing article - DON'T try to update updated_at since it doesn't exist
      const timestampField = auto_save ? 'auto_save_timestamp' : 'manual_save_timestamp';
      result = await query(
        `UPDATE articles
         SET content = $1, 
             word_count = $2,
             ${timestampField} = CURRENT_TIMESTAMP
         WHERE project_id = $3
         RETURNING id, project_id, content, word_count, 
                   auto_save_timestamp, manual_save_timestamp`,
        [content, word_count, projectId]
      );

      // If manual save, create version history
      if (!auto_save) {
        const articleId = result.rows[0].id;
        
        // Get current version number
        const versionResult = await query(
          'SELECT MAX(version_number) as max_version FROM article_versions WHERE article_id = $1',
          [articleId]
        );
        
        const nextVersion = (versionResult.rows[0].max_version || 0) + 1;
        
        // Insert version
        await query(
          `INSERT INTO article_versions (article_id, content, word_count, version_number)
           VALUES ($1, $2, $3, $4)`,
          [articleId, content, word_count, nextVersion]
        );
      }
    }

    return NextResponse.json({ 
      success: true,
      article: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}