import { motion } from "framer-motion"

export default function Projects() {
	return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1>Projects</h1>
    </motion.div>
  );
}
