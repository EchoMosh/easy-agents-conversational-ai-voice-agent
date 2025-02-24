
import { motion } from "framer-motion";

export const LoadingSpinner = () => {
  return (
    <motion.div
      key="completing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-4"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="mx-auto w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
      />
      <h2 className="text-2xl font-bold">Setting up your workspace...</h2>
      <p className="text-muted-foreground">Almost there!</p>
    </motion.div>
  );
};
