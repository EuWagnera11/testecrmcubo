import { useState, useCallback } from 'react';
import { Plus, ListTodo, Clock, Eye, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectTasks, TaskStatus, ProjectTask } from '@/hooks/useProjectTasks';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { TaskCard } from './TaskCard';
import { TaskDialog } from './TaskDialog';

interface KanbanBoardProps {
  projectId: string;
}

const columns: { status: TaskStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { status: 'todo', label: 'A Fazer', icon: <ListTodo className="h-4 w-4" />, color: 'text-muted-foreground' },
  { status: 'in_progress', label: 'Em Progresso', icon: <Clock className="h-4 w-4" />, color: 'text-primary' },
  { status: 'review', label: 'Revisão', icon: <Eye className="h-4 w-4" />, color: 'text-warning' },
  { status: 'done', label: 'Concluído', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-success' },
];

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { tasks, isLoading, createTask, updateTask, deleteTask, moveTask } = useProjectTasks(projectId);
  const { members } = useProjectMembers(projectId);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const getTasksByStatus = (status: TaskStatus) => 
    tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position);

  const handleDragStart = (e: React.DragEvent, task: ProjectTask) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('sourceStatus', task.status);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    const taskId = e.dataTransfer.getData('taskId');
    const sourceStatus = e.dataTransfer.getData('sourceStatus') as TaskStatus;
    
    if (sourceStatus === newStatus) return;

    // Get max position in new column
    const tasksInColumn = getTasksByStatus(newStatus);
    const newPosition = tasksInColumn.length > 0 
      ? Math.max(...tasksInColumn.map(t => t.position)) + 1 
      : 0;

    await moveTask.mutateAsync({ taskId, newStatus, newPosition });
  };

  const handleCreateTask = async (data: any) => {
    await createTask.mutateAsync(data);
    setDialogOpen(false);
  };

  const handleUpdateTask = async (data: Partial<ProjectTask> & { id: string }) => {
    await updateTask.mutateAsync(data);
    setEditingTask(null);
    setDialogOpen(false);
  };

  const handleEditTask = (task: ProjectTask) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask.mutateAsync(taskId);
  };

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando tarefas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold font-display">Quadro de Tarefas</h2>
        <Button size="sm" onClick={handleOpenNewTask}>
          <Plus className="h-4 w-4 mr-1" /> Nova Tarefa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => {
          const columnTasks = getTasksByStatus(column.status);
          const isDragOver = dragOverColumn === column.status;
          
          return (
            <Card 
              key={column.status} 
              className={`border-border/50 transition-colors ${
                isDragOver ? 'border-primary/50 bg-primary/5' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-sm font-medium flex items-center gap-2 ${column.color}`}>
                    {column.icon}
                    {column.label}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <ScrollArea className="h-[400px] pr-2">
                  <div className="space-y-2">
                    {columnTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        {isDragOver ? 'Solte aqui' : 'Sem tarefas'}
                      </div>
                    ) : (
                      columnTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={handleEditTask}
                          onDelete={handleDeleteTask}
                          onDragStart={handleDragStart}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        projectMembers={members}
        onSave={handleCreateTask}
        onUpdate={handleUpdateTask}
        isPending={createTask.isPending || updateTask.isPending}
      />
    </div>
  );
}
