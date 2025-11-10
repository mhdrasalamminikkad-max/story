import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Star } from "lucide-react";

export function AnimatedBackground() {
  const { theme } = useTheme();

  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 3 + 2,
  }));

  const clouds = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 60 + 10,
    scale: Math.random() * 0.5 + 0.7,
    duration: Math.random() * 30 + 40,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {theme === "night" && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 right-12"
        >
          <Moon className="w-16 h-16 text-yellow-200 drop-shadow-[0_0_20px_rgba(250,250,150,0.3)]" />
        </motion.div>
      )}

      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Star
            className={theme === "night" ? "text-yellow-100" : "text-purple-300"}
            style={{ width: `${star.size * 4}px`, height: `${star.size * 4}px` }}
            fill="currentColor"
          />
        </motion.div>
      ))}

      {clouds.map((cloud) => (
        <motion.div
          key={cloud.id}
          className={`absolute ${theme === "night" ? "opacity-10" : "opacity-20"}`}
          style={{
            top: `${cloud.y}%`,
          }}
          initial={{ x: "-10%" }}
          animate={{ x: "110%" }}
          transition={{
            duration: cloud.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div
            className={theme === "night" ? "text-indigo-300" : "text-blue-200"}
            style={{ transform: `scale(${cloud.scale})` }}
          >
            <svg width="120" height="60" viewBox="0 0 120 60" fill="currentColor">
              <ellipse cx="30" cy="35" rx="25" ry="20" />
              <ellipse cx="60" cy="25" rx="35" ry="25" />
              <ellipse cx="90" cy="35" rx="25" ry="20" />
            </svg>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
