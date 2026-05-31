// Weekly review: pulls goals + todos + tracked time together and surfaces
// the gap between stated priorities and where time/effort actually goes.

export interface ReviewGoal {
  id: string;
  text: string;
  area: string;
  horizon: string;
}
export interface ReviewTodo {
  id: string;
  title: string;
  goalId: string | null;
  status: string;
  alignment: string | null;
  effortMin: number;
  completedAt: string | null;
}
export interface ReviewTime {
  goalId: string | null;
  category: string | null;
  minutes: number;
}

export interface GoalAlignment {
  goalId: string;
  text: string;
  area: string;
  timeMin: number; // tracked minutes linked to this goal
  timePct: number; // share of goal-linked time
  openTodos: number;
  doneTodos: number;
  verdict: "ON_TRACK" | "UNDERINVESTED" | "NEGLECTED" | "NO_DATA";
}

export interface WeekReview {
  totalTrackedMin: number;
  goalLinkedMin: number;
  goalLinkedPct: number;
  busyworkOpen: number;
  alignedOpen: number;
  todosDoneThisWeek: number;
  goals: GoalAlignment[];
  mismatches: string[]; // human-readable "priority vs. time" flags
}

export function buildWeekReview(
  goals: ReviewGoal[],
  todos: ReviewTodo[],
  time: ReviewTime[]
): WeekReview {
  const totalTrackedMin = time.reduce((s, t) => s + t.minutes, 0);
  const goalLinkedMin = time.filter((t) => t.goalId).reduce((s, t) => s + t.minutes, 0);

  const timeByGoal = new Map<string, number>();
  for (const t of time) if (t.goalId) timeByGoal.set(t.goalId, (timeByGoal.get(t.goalId) ?? 0) + t.minutes);

  const openByGoal = new Map<string, number>();
  const doneByGoal = new Map<string, number>();
  for (const td of todos) {
    if (!td.goalId) continue;
    if (td.status === "DONE") doneByGoal.set(td.goalId, (doneByGoal.get(td.goalId) ?? 0) + 1);
    else if (td.status === "OPEN" || td.status === "DOING") openByGoal.set(td.goalId, (openByGoal.get(td.goalId) ?? 0) + 1);
  }

  // Short-horizon goals are expected to get more time now.
  const priorityRank: Record<string, number> = { ONE_YEAR: 3, THREE_YEARS: 2, TEN_YEARS: 1, LIFE: 1 };

  const goalAlignments: GoalAlignment[] = goals.map((g) => {
    const timeMin = timeByGoal.get(g.id) ?? 0;
    const timePct = goalLinkedMin > 0 ? Math.round((timeMin / goalLinkedMin) * 100) : 0;
    const open = openByGoal.get(g.id) ?? 0;
    const done = doneByGoal.get(g.id) ?? 0;
    let verdict: GoalAlignment["verdict"];
    if (totalTrackedMin === 0) verdict = "NO_DATA";
    else if (timeMin === 0 && open === 0) verdict = "NEGLECTED";
    else if (timeMin === 0) verdict = "UNDERINVESTED";
    else verdict = "ON_TRACK";
    return { goalId: g.id, text: g.text, area: g.area, timeMin, timePct, openTodos: open, doneTodos: done, verdict };
  });

  const mismatches: string[] = [];
  for (const g of goalAlignments) {
    const goal = goals.find((x) => x.id === g.goalId)!;
    const rank = priorityRank[goal.horizon] ?? 2;
    if (totalTrackedMin > 0 && rank >= 3 && g.timeMin === 0) {
      mismatches.push(`„${g.text}" ist ein 1-Jahres-Ziel, aber du hast diese Woche 0 erfasste Zeit darauf verwendet.`);
    } else if (totalTrackedMin > 0 && rank >= 3 && g.timePct < 10 && g.timePct > 0) {
      mismatches.push(`„${g.text}" (1-Jahres-Ziel) bekam nur ${g.timePct}% deiner zielbezogenen Zeit.`);
    }
    if (g.openTodos > 0 && g.timeMin === 0) {
      mismatches.push(`Für „${g.text}" hast du ${g.openTodos} offene Todos, aber keine Zeit investiert.`);
    }
  }

  const busyworkOpen = todos.filter((t) => (t.status === "OPEN" || t.status === "DOING") && t.alignment === "BUSYWORK").length;
  const alignedOpen = todos.filter((t) => (t.status === "OPEN" || t.status === "DOING") && t.alignment === "ALIGNED").length;
  const todosDoneThisWeek = todos.filter((t) => t.status === "DONE").length;

  return {
    totalTrackedMin,
    goalLinkedMin,
    goalLinkedPct: totalTrackedMin > 0 ? Math.round((goalLinkedMin / totalTrackedMin) * 100) : 0,
    busyworkOpen,
    alignedOpen,
    todosDoneThisWeek,
    goals: goalAlignments.sort((a, b) => b.timeMin - a.timeMin),
    mismatches,
  };
}

export const VERDICT_META: Record<GoalAlignment["verdict"], { label: string; color: string }> = {
  ON_TRACK: { label: "auf Kurs", color: "#34d399" },
  UNDERINVESTED: { label: "zu wenig Zeit", color: "#fbbf24" },
  NEGLECTED: { label: "vernachlässigt", color: "#f87171" },
  NO_DATA: { label: "keine Daten", color: "#94a3b8" },
};
