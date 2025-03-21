
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Upload, UserPlus } from "lucide-react";
import { NewLeadForm } from "@/components/leads/new-lead-form";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AddLeadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Animation variants for cards - optimized for performance
const cardVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  hover: { scale: 1.02, transition: { duration: 0.15 } },
  tap: { scale: 0.98 }
};

// Animation variants for content transitions - simplified
const contentVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.25,
      staggerChildren: 0.08
    }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

export function AddLeadDialog({ isOpen, onOpenChange, onSuccess }: AddLeadDialogProps) {
  const [mode, setMode] = useState<"single" | "bulk" | null>(null);
  
  const handleSelectMode = (selectedMode: "single" | "bulk") => {
    setMode(selectedMode);
  };

  const handleClose = () => {
    setMode(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <Button
        onClick={() => onOpenChange(true)}
        className="bg-primary hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Lead
      </Button>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-xl bg-gradient-to-br from-white to-gray-50 rounded-xl will-change-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-blue-50/50 pointer-events-none" />
        
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Add Leads
          </DialogTitle>
        </DialogHeader>
        
        {mode === null && (
          <motion.div 
            className="grid grid-cols-2 gap-4 p-6"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
            layout
          >
            <motion.div
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
              layout
            >
              <Card 
                className={cn(
                  "cursor-pointer overflow-hidden border-2 hover:border-primary transition-all duration-150",
                  "bg-gradient-to-br from-white to-purple-50 will-change-transform"
                )}
                onClick={() => handleSelectMode("single")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 h-full">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="rounded-full bg-primary/10 p-3 mb-3">
                      <UserPlus className="h-10 w-10 text-primary" />
                    </div>
                  </motion.div>
                  <h3 className="text-lg font-medium">Add Single Lead</h3>
                  <p className="text-sm text-center text-muted-foreground mt-2">
                    Manually add a new lead with contact details
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
              layout
            >
              <Card 
                className={cn(
                  "cursor-pointer overflow-hidden border-2 hover:border-primary transition-all duration-150",
                  "bg-gradient-to-br from-white to-blue-50 will-change-transform"
                )}
                onClick={() => handleSelectMode("bulk")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 h-full">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="rounded-full bg-blue-500/10 p-3 mb-3">
                      <Upload className="h-10 w-10 text-blue-500" />
                    </div>
                  </motion.div>
                  <h3 className="text-lg font-medium">Bulk Upload</h3>
                  <p className="text-sm text-center text-muted-foreground mt-2">
                    Upload a CSV file with multiple leads
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
        
        {mode === "single" && (
          <motion.div 
            className="py-4 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setMode(null)} 
              className="mb-4 hover:bg-primary/10 transition-colors"
            >
              ← Back to options
            </Button>
            <NewLeadForm onSuccess={() => {
              handleClose();
              onSuccess();
            }} />
          </motion.div>
        )}
        
        {mode === "bulk" && (
          <motion.div 
            className="py-4 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setMode(null)} 
              className="mb-4 hover:bg-primary/10 transition-colors"
            >
              ← Back to options
            </Button>
            
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.01 }}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors bg-white/50 backdrop-blur-sm will-change-transform"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 400,
                      damping: 15,
                      duration: 0.2
                    }}
                  >
                    <Upload className="h-8 w-8 text-blue-500" />
                  </motion.div>
                  <p className="text-sm font-medium mt-2">
                    Drag and drop a CSV file here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    File should include: name, email, phone, status
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 bg-white">
                    Select File
                  </Button>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md"
              >
                <p className="mb-1 font-medium">Requirements:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>CSV format only</li>
                  <li>Required fields: name, email</li>
                  <li>Optional: phone, status, source</li>
                </ul>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex justify-end pt-4"
              >
                <Button onClick={handleClose} variant="outline" className="mr-2">
                  Cancel
                </Button>
                <Button disabled className="ml-2 bg-primary hover:bg-primary/90">
                  Upload Leads
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
