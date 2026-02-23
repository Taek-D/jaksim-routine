type RoutineColorSet = {
  accent: string;
  bgTint: string;
  iconBg: string;
  iconText: string;
  progressBar: string;
};

const PALETTE: RoutineColorSet[] = [
  {
    accent: "border-l-emerald-500",
    bgTint: "bg-emerald-50/30",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
    progressBar: "bg-emerald-500",
  },
  {
    accent: "border-l-blue-500",
    bgTint: "bg-blue-50/30",
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
    progressBar: "bg-blue-500",
  },
  {
    accent: "border-l-violet-500",
    bgTint: "bg-violet-50/30",
    iconBg: "bg-violet-100",
    iconText: "text-violet-600",
    progressBar: "bg-violet-500",
  },
];

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getRoutineColor(id: string): RoutineColorSet {
  return PALETTE[hashId(id) % PALETTE.length];
}
