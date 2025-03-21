import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Upload, UserPlus } from "lucide-react";
import { NewLeadForm } from "@/components/leads/new-lead-form";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CsvPreviewStage } from "./csv/csv-preview-stage";
import { CsvData, ColumnMapping } from "./csv/csv-preview-table";

interface AddLeadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const cardVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  hover: { scale: 1.02, transition: { duration: 0.15 } },
  tap: { scale: 0.98 }
};

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
  const [mode, setMode] = useState<"select" | "single" | "bulk" | "csvPreview" | null>(null);
  
  useEffect(() => {
    if (!isOpen) {
      setMode(null);
    } else if (mode === null) {
      setMode("select");
    }
  }, [isOpen, mode]);

  const handleSelectMode = (selectedMode: "single" | "bulk") => {
    if (selectedMode === "bulk") {
      setMode("csvPreview");
    } else {
      setMode(selectedMode);
    }
  };

  const handleCsvNext = (data: CsvData, mappings: ColumnMapping[]) => {
    console.log("CSV data:", data);
    console.log("Column mappings:", mappings);
    setMode("select");
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
      <DialogContent 
        className={cn(
          "p-0 overflow-hidden border-none shadow-xl rounded-xl will-change-transform z-[101] bg-white",
          mode === "csvPreview" ? "sm:max-w-[90vw] md:max-w-[900px] w-[95vw]" : "sm:max-w-[500px]"
        )}
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-gray-800">
            {mode === "csvPreview" ? "Import Leads from CSV" : "Add Leads"}
          </DialogTitle>
        </DialogHeader>
        
        {mode === "select" && (
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
                  "bg-white will-change-transform"
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
                  <h3 className="text-lg font-medium text-gray-800">Add Single Lead</h3>
                  <p className="text-sm text-center text-gray-600 mt-2">
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
                  "bg-white will-change-transform"
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
                  <h3 className="text-lg font-medium text-gray-800">Bulk Upload</h3>
                  <p className="text-sm text-center text-gray-600 mt-2">
                    Upload a CSV file with multiple leads
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
        
        {mode === "single" && (
          <motion.div 
            className="py-2 px-6 pb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <NewLeadForm onSuccess={() => {
              handleClose();
              onSuccess();
            }} />
          </motion.div>
        )}
        
        {mode === "csvPreview" && (
          <motion.div 
            className="py-2 px-6 pb-6 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <CsvPreviewStage 
              onNext={handleCsvNext} 
              onCancel={() => setMode("select")} 
            />
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
