
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lead } from "@/pages/dashboard/leads";
import { format } from "date-fns";
import { PipelineColumn } from "@/types/pipeline";
import { User, Mail, Phone, CalendarDays, UserCircle } from "lucide-react";
import { motion } from "framer-motion";

interface LeadDetailsDialogProps {
  lead: Lead | null;
  onClose: () => void;
  columns: PipelineColumn[];
}

export function LeadDetailsDialog({ lead, onClose, columns }: LeadDetailsDialogProps) {
  if (!lead) return null;

  const containerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07
      }
    }
  };
  
  const itemAnimation = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  const findColumnColor = (status: string) => {
    const column = columns.find(col => col.title === status);
    return column?.color || "bg-gray-200";
  };

  return (
    <Dialog open={!!lead} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden bg-background/95 backdrop-blur-sm border-none shadow-2xl rounded-xl">
        <div className="px-6 pt-6 pb-2">
          <DialogHeader className="pb-0 mb-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                <UserCircle className="h-5 w-5 text-primary" strokeWidth={2} />
              </div>
              <DialogTitle className="text-lg font-medium leading-none">
                {lead.name}
              </DialogTitle>
            </div>
          </DialogHeader>
        </div>

        <motion.div 
          className="p-6 pt-2 space-y-4"
          variants={containerAnimation}
          initial="hidden"
          animate="show"
        >
          {/* Contact Information */}
          <motion.div variants={itemAnimation} className="space-y-2.5">
            {lead.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-primary/70" />
                <span className="text-sm">{lead.email}</span>
              </div>
            )}
            
            {lead.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-primary/70" />
                <span className="text-sm">{lead.phone}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2.5">
              <CalendarDays className="h-4 w-4 text-primary/70" />
              <span className="text-sm">{format(new Date(lead.created_at), 'MMM dd, yyyy')}</span>
            </div>
          </motion.div>

          {/* Status */}
          <motion.div variants={itemAnimation} className="pt-1">
            <div className="flex items-center gap-3">
              <p className="text-xs font-medium text-muted-foreground">STATUS</p>
              <Badge 
                variant="outline" 
                className={`${findColumnColor(lead.status)} text-background px-2.5 py-0.5 text-xs rounded-md`}
              >
                {lead.status}
              </Badge>
            </div>
          </motion.div>

          {/* Variables (if any) */}
          {lead.variables && lead.variables.length > 0 && (
            <motion.div variants={itemAnimation} className="pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-2.5">VARIABLES</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-secondary/5 rounded-lg p-3">
                {lead.variables.map((variable, index) => (
                  <div key={index} className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">{variable.name}</p>
                    <p className="text-sm font-medium">{variable.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
