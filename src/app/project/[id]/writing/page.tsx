import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import pool from '@/lib/db';
import WritingEditor from '@/components/writing/WritingEditor';

export default async function WritingPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const projectId = params.id;

  // Verify project belongs to user and get article
  const result = await pool.query(
    `SELECT p.id, p.name, a.content
     FROM projects p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN articles a ON a.project_id = p.id
     WHERE p.id = $1 AND u.email = $2`,
    [projectId, session.user.email]
  );

  if (result.rows.length === 0) {
    redirect('/dashboard');
  }

  const project = result.rows[0];
  const initialContent = project.content || '';

  return (
    <div className="h-screen flex flex-col">
      <WritingEditor 
        projectId={projectId} 
        initialContent={initialContent}
      />
    </div>
  );
}