
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/pages/dashboard/leads";
import { format } from "date-fns";
import { PipelineColumn } from "@/types/pipeline";
import { Mail, Phone, Calendar, User, Copy, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface LeadDetailsDialogProps {
  lead: Lead | null;
  onClose: () => void;
  columns: PipelineColumn[];
}

export function LeadDetailsDialog({ lead, onClose, columns }: LeadDetailsDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!lead) return null;

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const findColumnColor = (status: string) => {
    const column = columns.find(col => col.title === status);
    return column?.color || "bg-gray-200";
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${lead.name} - ${lead.email || 'No email'}`);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Lead details copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut"
      }
    })
  };

  return (
    <Dialog open={!!lead} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-hidden max-w-lg bg-background/95 backdrop-blur-sm border-none shadow-xl rounded-xl">
        <div className="flex flex-col w-full">
          {/* Header with avatar */}
          <div className="px-8 pt-8 pb-5 flex flex-col items-center relative">
            <Avatar className="h-24 w-24 mb-4 border-4 border-primary/10">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>
            
            <motion.h2 
              className="text-2xl font-semibold mb-1 text-center"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {lead.name}
            </motion.h2>
            
            {lead.email && (
              <motion.p 
                className="text-muted-foreground text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {lead.email}
              </motion.p>
            )}

            <div className="absolute right-6 top-6 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 gap-1.5 text-xs"
                onClick={copyToClipboard}
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copied' : 'Copy link'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 gap-1.5 text-xs"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View profile
              </Button>
            </div>
          </div>

          {/* Details content */}
          <div className="p-6 pt-3 border-t border-border/40">
            <div className="space-y-6">
              {/* Status */}
              <motion.div 
                custom={0} 
                initial="hidden" 
                animate="visible" 
                variants={fadeInUpVariants}
                className="flex justify-between items-center"
              >
                <div className="text-sm font-medium">Status</div>
                <Badge 
                  variant="outline" 
                  className={`${findColumnColor(lead.status)} text-background px-3 py-1 text-xs rounded-md`}
                >
                  {lead.status}
                </Badge>
              </motion.div>

              {/* Contact Info */}
              {(lead.email || lead.phone) && (
                <motion.div 
                  custom={1} 
                  initial="hidden" 
                  animate="visible" 
                  variants={fadeInUpVariants}
                  className="space-y-4"
                >
                  <div className="text-sm font-medium text-muted-foreground">CONTACT INFO</div>
                  
                  {lead.email && (
                    <div className="flex items-center gap-2.5 group">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Email address</div>
                        <Input 
                          value={lead.email} 
                          readOnly 
                          className="border-0 p-0 h-7 bg-transparent text-muted-foreground text-sm"
                        />
                      </div>
                    </div>
                  )}
                  
                  {lead.phone && (
                    <div className="flex items-center gap-2.5">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Phone number</div>
                        <Input 
                          value={lead.phone} 
                          readOnly 
                          className="border-0 p-0 h-7 bg-transparent text-muted-foreground text-sm"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Date Added */}
              <motion.div 
                custom={2} 
                initial="hidden" 
                animate="visible" 
                variants={fadeInUpVariants}
                className="flex items-center gap-2.5"
              >
                <div className="bg-primary/10 p-2 rounded-md">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Created on</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(lead.created_at), 'MMMM dd, yyyy')}
                  </div>
                </div>
              </motion.div>

              {/* Variables (if any) */}
              {lead.variables && lead.variables.length > 0 && (
                <motion.div 
                  custom={3} 
                  initial="hidden" 
                  animate="visible" 
                  variants={fadeInUpVariants}
                  className="space-y-3"
                >
                  <div className="text-sm font-medium text-muted-foreground">VARIABLES</div>
                  <div className="space-y-3">
                    {lead.variables.map((variable, index) => (
                      <div key={index} className="flex items-center gap-2.5">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{variable.name}</div>
                          <div className="text-sm text-muted-foreground">{variable.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
