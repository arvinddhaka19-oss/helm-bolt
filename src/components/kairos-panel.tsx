import { CheckSquare } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Task } from "@/types"

interface KairosPanelProps {
  tasks: Task[]
  onToggle: (id: string) => void
}

const priorityBorder: Record<Task["priority"], string> = {
  high: "border-l-[#C8102E]",
  medium: "border-l-[#FFD700]",
  low: "border-l-[#00FF66]",
}

const priorityBadge: Record<Task["priority"], string> = {
  high: "bg-[#C8102E]/20 text-[#C8102E] border-[#C8102E]/30",
  medium: "bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30",
  low: "bg-[#00FF66]/20 text-[#00FF66] border-[#00FF66]/30",
}

export function KairosPanel({ tasks, onToggle }: KairosPanelProps) {
  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const percent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <Card className="flex h-full flex-col border-[#0A1C14] bg-[#0A1C14] shadow-lg shadow-black/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#F8FAFC]">
          <CheckSquare className="size-4 text-[#00FF66]" />
          KAIROS
          <span className="text-xs font-normal text-[#F8FAFC]/40">
            Tasks &amp; Reminders
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
        {/* Progress bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#F8FAFC]/50">Progress</span>
            <span className="font-semibold text-[#FFD700]">
              {completedCount} of {totalCount} complete
            </span>
          </div>
          <Progress
            value={percent}
            className="h-2 bg-[#040D0A] [&>[data-slot=progress-indicator]]:bg-[#FFD700]"
          />
        </div>

        {/* Task list */}
        <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-3 rounded-md border-l-2 bg-[#040D0A]/50 px-3 py-2.5 transition-all",
                priorityBorder[task.priority],
                task.completed && "opacity-40"
              )}
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggle(task.id)}
                className="border-[#F8FAFC]/30 data-[state=checked]:border-[#FFD700] data-[state=checked]:bg-[#FFD700] data-[state=checked]:text-[#040D0A]"
              />
              <span
                className={cn(
                  "flex-1 text-sm text-[#F8FAFC]/80",
                  task.completed && "line-through"
                )}
              >
                {task.title}
              </span>
              <Badge
                variant="outline"
                className={cn("border text-[10px]", priorityBadge[task.priority])}
              >
                {task.due_label}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
