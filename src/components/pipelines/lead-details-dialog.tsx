
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lead } from "@/pages/dashboard/leads";
import { format } from "date-fns";
import { PipelineColumn } from "@/types/pipeline";
import { User, Mail, Phone, CalendarDays } from "lucide-react";
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
        staggerChildren: 0.1
      }
    }
  };
  
  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const findColumnColor = (status: string) => {
    const column = columns.find(col => col.title === status);
    return column?.color || "bg-gray-200";
  };

  return (
    <Dialog open={!!lead} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden bg-background/95 backdrop-blur-sm border-none shadow-2xl rounded-xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <span className="bg-primary/10 p-2 rounded-full">
              <User className="h-5 w-5 text-primary" />
            </span>
            Lead Details
          </DialogTitle>
        </DialogHeader>

        <motion.div 
          className="space-y-5"
          variants={containerAnimation}
          initial="hidden"
          animate="show"
        >
          {/* Contact Information Card */}
          <motion.div variants={itemAnimation}>
            <Card className="border-none shadow-none bg-secondary/10 overflow-hidden">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-primary/70" />
                    <span className="font-medium">{lead.name}</span>
                  </div>
                  
                  {lead.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-primary/70" />
                      <span>{lead.email}</span>
                    </div>
                  )}
                  
                  {lead.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-primary/70" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status */}
          <motion.div variants={itemAnimation}>
            <Card className="border-none shadow-none bg-secondary/10 overflow-hidden">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Status</h3>
                <Badge 
                  variant="outline" 
                  className={`${findColumnColor(lead.status)} text-background px-4 py-1.5 text-sm`}
                >
                  {lead.status}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>

          {/* Variables (if any) */}
          {lead.variables && lead.variables.length > 0 && (
            <motion.div variants={itemAnimation}>
              <Card className="border-none shadow-none bg-secondary/10 overflow-hidden">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Variables</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {lead.variables.map((variable, index) => (
                      <div key={index} className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{variable.name}</p>
                        <p className="text-sm font-medium">{variable.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Created Date */}
          <motion.div variants={itemAnimation}>
            <Card className="border-none shadow-none bg-secondary/10 overflow-hidden">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Created</h3>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-primary/70" />
                  <span>{format(new Date(lead.created_at), 'MMMM dd, yyyy')}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
