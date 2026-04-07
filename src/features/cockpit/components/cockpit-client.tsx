'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskList } from './task-list';
import { PersonalKpis } from './personal-kpis';
import { TeamKpisCompact } from './team-kpis-compact';
import { ScriptLibrary } from './script-library';
import { CreateTaskModal } from './create-task-modal';
import { MorningSummary } from '@/features/ai-chat/components/morning-summary';
import { useTasks } from '../hooks/use-tasks';
import { usePersonalKpis } from '../hooks/use-personal-kpis';

interface CockpitClientProps {
  userId: string;
  userRole: 'vendedor' | 'direccion' | 'admin';
}

function PersonalKpisCard() {
  const { kpis, loading } = usePersonalKpis();
  return <PersonalKpis kpis={kpis} loading={loading} />;
}

export function CockpitClient({ userId, userRole }: CockpitClientProps) {
  const [showCreateTask, setShowCreateTask] = useState(false);
  const { tasks, loading, completeTask, refresh } = useTasks();
  const isVendedor = userRole === 'vendedor';

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main area — summary + task list */}
      <div className="space-y-4 lg:col-span-2">
        <MorningSummary />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mis tareas</h2>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setShowCreateTask(true)}
          >
            <Plus className="h-4 w-4" />
            Nueva tarea
          </Button>
        </div>

        <TaskList
          tasks={tasks}
          loading={loading}
          onComplete={completeTask}
        />
      </div>

      {/* Right sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {isVendedor ? 'Mis KPIs' : 'KPIs del equipo'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isVendedor ? <PersonalKpisCard /> : <TeamKpisCompact />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Scripts</CardTitle>
          </CardHeader>
          <CardContent>
            <ScriptLibrary />
          </CardContent>
        </Card>
      </div>

      <CreateTaskModal
        userId={userId}
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        onCreated={refresh}
      />
    </div>
  );
}
