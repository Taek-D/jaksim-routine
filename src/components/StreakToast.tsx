import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface StreakToastProps {
  open: boolean;
  routineName: string;
  streak: number;
  onDismiss: () => void;
}

function getStreakMessage(routineName: string, streak: number): string {
  if (streak <= 0) {
    return `\u2705 ${routineName} \uccb4\ud06c\uc778 \uc644\ub8cc!`;
  }
  if (streak <= 2) {
    return `\ud83d\udd25 ${routineName} ${streak}\uc77c \uc5f0\uc18d \ub2ec\uc131!`;
  }
  if (streak <= 6) {
    return `\ud83d\udd25 ${routineName} ${streak}\uc77c \uc5f0\uc18d! \uc798\ud558\uace0 \uc788\uc5b4\uc694`;
  }
  if (streak <= 13) {
    return `\ud83c\udf1f ${routineName} ${streak}\uc77c \uc5f0\uc18d! \ub300\ub2e8\ud574\uc694`;
  }
  return `\ud83c\udfc6 ${routineName} ${streak}\uc77c \uc5f0\uc18d! \ubbff\uc744 \uc218 \uc5c6\ub294 \uaf08\uae30!`;
}

export default function StreakToast({ open, routineName, streak, onDismiss }: StreakToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onDismiss, 2500);
    return () => window.clearTimeout(timer);
  }, [open, onDismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed left-1/2 -translate-x-1/2 bottom-[140px] z-[100]"
          initial={{ opacity: 0, y: 20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -10, x: "-50%" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          role="status"
          aria-live="polite"
        >
          <div className="bg-text text-white text-[14px] font-semibold px-5 py-3 rounded-card shadow-elevated whitespace-nowrap">
            {getStreakMessage(routineName, streak)}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
