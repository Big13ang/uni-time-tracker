import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState, Row } from '@tanstack/react-table';

interface Task {
  id: number;
  task: string;
  project: string;
  department: string;
  date: string; // ISO date string
  timeSpentMs: number;
  isRunning: boolean;
}

// format time from milliseconds to HH:MM:SS
const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const initialTasksData: Task[] = [
  {
    id: 1,
    task: 'Initial design mockups',
    project: 'Website Redesign',
    department: 'Design',
    date: '2025-05-23',
    timeSpentMs: 0, // 0 seconds
    isRunning: false,
  },
  {
    id: 2,
    task: 'API endpoint development',
    project: 'Mobile App Backend',
    department: 'Development',
    date: '2025-05-23',
    timeSpentMs: 3600000, // 1 hour
    isRunning: false,
  },
  {
    id: 3,
    task: 'Client onboarding call',
    project: 'CRM Integration',
    department: 'Sales',
    date: '2025-05-24',
    timeSpentMs: 1800000, // 30 minutes
    isRunning: false,
  },
];

interface AddTaskFormProps {
  onAddTask: (newTaskData: Omit<Task, 'id' | 'timeSpentMs' | 'isRunning'>) => void;
  departments: string[];
  projects: string[];
}

function AddTaskForm({ onAddTask, departments, projects }: AddTaskFormProps) {
  const [task, setTask] = useState<string>('');
  const [project, setProject] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!task.trim() || !project.trim() || !department.trim() || !date) {
      alert('Please fill in all fields!');
      return;
    }
    onAddTask({ task, project, department, date });
    setTask('');
    setProject('');
    setDepartment('');
    // reset date
    setDate(new Date().toISOString().slice(0, 10)); 
  };


  return (
    <form onSubmit={handleSubmit} className="add-task-form">
      <input
        type="text"
        placeholder="Task Description"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        aria-label="Task Description"
      />
      <input
        type="text"
        placeholder="Project Name"
        value={project}
        onChange={(e) => setProject(e.target.value)}
        list="projects-datalist"
        aria-label="Project Name"
      />
      <datalist id="projects-datalist">
        {projects.map(p => <option key={p} value={p} />)}
      </datalist>
      <input
        type="text"
        placeholder="Department"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        list="departments-datalist"
        aria-label="Department"
      />
      <datalist id="departments-datalist">
        {departments.map(d => <option key={d} value={d} />)}
      </datalist>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        aria-label="Date"
      />
      <button type="submit">Add Task</button>
    </form>
  );
}

interface FiltersProps {
  departmentFilter: string;
  setDepartmentFilter: (filter: string) => void;
  projectFilter: string;
  setProjectFilter: (filter: string) => void;
  uniqueDepartments: string[];
  uniqueProjects: string[];
}

function Filters({
  departmentFilter,
  setDepartmentFilter,
  projectFilter,
  setProjectFilter,
  uniqueDepartments,
  uniqueProjects
}: FiltersProps) {
  return (
    <div className="filters-container">
      <select
        value={departmentFilter}
        onChange={(e) => setDepartmentFilter(e.target.value)}
        aria-label="Filter by Department"
      >
        <option value="">All Departments</option>
        {uniqueDepartments.map(dept => (
          <option key={dept} value={dept}>{dept}</option>
        ))}
      </select>
      <select
        value={projectFilter}
        onChange={(e) => setProjectFilter(e.target.value)}
        aria-label="Filter by Project"
      >
        <option value="">All Projects</option>
        {uniqueProjects.map(proj => (
          <option key={proj} value={proj}>{proj}</option>
        ))}
      </select>
    </div>
  );
}

interface TaskTableProps {
  tasks: Task[];
  onToggleTimer: (taskId: number) => void;
  globalFilter: string;
  setGlobalFilter: (filter: string) => void;
}

function TaskTable({ tasks, onToggleTimer, globalFilter, setGlobalFilter }: TaskTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        accessorKey: 'task',
        header: 'Task',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'project',
        header: 'Project',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: info => new Date(info.getValue() as string).toLocaleDateString(),
      },
      {
        accessorKey: 'timeSpentMs',
        header: 'Time Spent',
        cell: info => (
          <span style={(info.row.original as Task).isRunning ? { color: 'red', fontWeight: 'bold' } : {}}>
            {formatTime(info.getValue() as number)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Tracker',
        cell: ({ row }: { row: Row<Task> }) => (
          <button
            onClick={() => onToggleTimer(row.original.id)}
            className={`tracker-button ${row.original.isRunning ? 'pause' : 'play'}`}
            aria-label={row.original.isRunning ? `Pause timer for ${row.original.task}` : `Play timer for ${row.original.task}`}
          >
            {row.original.isRunning ? 'Pause' : 'Play'}
          </button>
        ),
      },
    ],
    [onToggleTimer]
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const totalTimeSpent = useMemo(() => {
    return tasks.reduce((acc, task) => acc + task.timeSpentMs, 0);
  }, [tasks]);

  return (
    <div className="table-container">
      <table>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} onClick={header.column.getToggleSortingHandler()}
                    className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  {{
                    asc: ' 🔼',
                    desc: ' 🔽',
                  }[header.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center' }}>
                No tasks found. Try adjusting your filters or adding a new task.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={columns.findIndex(col => (col as any).accessorKey === 'timeSpentMs')}>
              <strong>Total Time:</strong>
            </td>
            <td colSpan={columns.length - columns.findIndex(col => (col as any).accessorKey === 'timeSpentMs')}>
              <strong>{formatTime(totalTimeSpent)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}


function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasksData);
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [globalFilter, setGlobalFilter] = useState<string>('');


  // Timer logic
  useEffect(() => {
    let intervalId: number | undefined;
    const runningTask = tasks.find(task => task.isRunning);

    if (runningTask) {
      intervalId = window.setInterval(() => {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === runningTask.id
              ? { ...task, timeSpentMs: task.timeSpentMs + 1000 }
              : task
          )
        );
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [tasks]);

  const handleAddTask = useCallback((newTaskData: Omit<Task, 'id' | 'timeSpentMs' | 'isRunning'>) => {
    setTasks(prevTasks => [
      ...prevTasks,
      {
        ...newTaskData,
        id: Date.now(),
        timeSpentMs: 0,
        isRunning: false,
      },
    ]);
  }, []);

  const handleToggleTimer = useCallback((taskId: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          return { ...task, isRunning: !task.isRunning };
        }
        return { ...task, isRunning: false };
      })
    );
  }, []);

  const uniqueDepartments = useMemo(() => [...new Set(tasks.map(task => task.department).sort())], [tasks]);
  const uniqueProjects = useMemo(() => [...new Set(tasks.map(task => task.project).sort())], [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const departmentMatch = departmentFilter ? task.department === departmentFilter : true;
      const projectMatch = projectFilter ? task.project === projectFilter : true;
      return departmentMatch && projectMatch;
    });
  }, [tasks, departmentFilter, projectFilter]);


  return (
    <>
      <div className="app-container">
        <h1>Time Tracker</h1>
        <AddTaskForm
            onAddTask={handleAddTask}
            departments={uniqueDepartments}
            projects={uniqueProjects}
        />
        <Filters
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          projectFilter={projectFilter}
          setProjectFilter={setProjectFilter}
          uniqueDepartments={uniqueDepartments}
          uniqueProjects={uniqueProjects}
        />
        <TaskTable
          tasks={filteredTasks}
          onToggleTimer={handleToggleTimer}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
      </div>
    </>
  );
}

export default App;
