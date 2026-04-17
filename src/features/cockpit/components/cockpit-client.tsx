'use client';

import { useState } from 'react';
import { Plus, List, CalendarDays, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TaskList } from './task-list';
import { TaskAllView } from './task-all-view';
import { TaskCalendarPanel } from './task-calendar-panel';
import { PersonalKpis } from './personal-kpis';
import { TeamKpisCompact } from './team-kpis-compact';
import { ScriptLibrary } from './script-library';
import { CreateTaskModal } from './create-task-modal';
import { MorningSummary } from '@/features/ai-chat/components/morning-summary';
import { useFeatureFlag } from '@/features/tenant/lib/tenant-context';
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
  const [view, setView] = useState<'list' | 'calendar' | 'all'>('calendar');
  const { tasks, loading, completeTask, refresh } = useTasks();
  const isVendedor = userRole === 'vendedor';
  const morningSummaryEnabled = useFeatureFlag('feat_morning_summary');

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main area — summary + task list/calendar */}
      <div className="space-y-4 lg:col-span-2">
        {morningSummaryEnabled && <MorningSummary />}

        <Tabs
          value={view}
          onValueChange={(v) => setView(v as 'list' | 'calendar' | 'all')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Mis tareas</h2>
              <TabsList>
                <TabsTrigger value="list">
                  <List className="h-3.5 w-3.5" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="calendar">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Calendario
                </TabsTrigger>
                <TabsTrigger value="all">
                  <LayoutList className="h-3.5 w-3.5" />
                  Todas
                </TabsTrigger>
              </TabsList>
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setShowCreateTask(true)}
            >
              <Plus className="h-4 w-4" />
              Nueva tarea
            </Button>
          </div>

          <TabsContent value="list" className="mt-4">
            <TaskList tasks={tasks} loading={loading} onComplete={completeTask} />
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <TaskCalendarPanel
                  tasks={tasks}
                  loading={loading}
                  onComplete={completeTask}
                  onCreated={refresh}
                  userId={userId}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <TaskAllView
                  tasks={tasks}
                  loading={loading}
                  onComplete={completeTask}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right sidebar — KPIs + Scripts (calendar moved into main toggle) */}
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
