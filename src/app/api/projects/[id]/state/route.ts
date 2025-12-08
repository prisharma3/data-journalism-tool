import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Helper to get user from token
function getUserFromToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

// GET /api/projects/[id]/state - Load project state
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Verify project belongs to user
    const projectCheck = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get project state
    const result = await query(
      'SELECT state FROM project_states WHERE project_id = $1',
      [projectId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ state: null });
    }

    return NextResponse.json({ state: result.rows[0].state });

  } catch (error) {
    console.error('Load project state error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/state - Save project state
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { state } = await request.json();

    // Verify project belongs to user
    const projectCheck = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Upsert project state
    await query(
      `INSERT INTO project_states (project_id, state, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (project_id)
       DO UPDATE SET state = $2, updated_at = NOW()`,
      [projectId, JSON.stringify(state)]
    );

    // Also update project's updated_at
    await query(
      'UPDATE projects SET updated_at = NOW() WHERE id = $1',
      [projectId]
    );

    return NextResponse.json({ message: 'State saved successfully' });

  } catch (error) {
    console.error('Save project state error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}