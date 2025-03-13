
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/pages/dashboard/leads";
import { format } from "date-fns";
import { PipelineColumn } from "@/types/pipeline";
import { Mail, Phone, Calendar, User, ExternalLink, Trash2, Activity } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ActivityTab } from "@/components/chat/tabs/activity-tab";
import { Card, CardContent } from "@/components/ui/card";

interface LeadDetailsDialogProps {
  lead: Lead | null;
  onClose: () => void;
  columns: PipelineColumn[];
}

interface Activity {
  id: string;
  type: 'email' | 'sms';
  content: string;
  timestamp: string;
}

export function LeadDetailsDialog({ lead, onClose, columns }: LeadDetailsDialogProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRemoving, setIsRemoving] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (lead) {
      fetchActivities(lead.id);
    }
  }, [lead]);

  const fetchActivities = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // Transform to the format expected by ActivityTab with explicit type casting
      const formattedActivities = (data || []).map(activity => ({
        id: activity.id,
        type: activity.content.toLowerCase().includes('email') ? 'email' as const : 'sms' as const,
        content: activity.content,
        timestamp: activity.created_at
      }));
      
      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

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

  const handleViewProfile = () => {
    onClose();
    navigate(`/dashboard/chats?leadId=${lead.id}`);
  };

  const handleRemoveLead = async () => {
    setIsRemoving(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({ 
          pipeline_id: null,
          status: null
        })
        .eq("id", lead.id);

      if (error) throw error;
      
      toast({
        title: "Lead removed",
        description: "Lead has been removed from pipeline",
      });
      onClose();
    } catch (error) {
      console.error("Error removing lead:", error);
      toast({
        title: "Error",
        description: "Failed to remove lead from pipeline",
        variant: "destructive"
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Dialog open={!!lead} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-hidden max-w-4xl bg-background/95 backdrop-blur-sm border-none shadow-lg rounded-2xl">
        <div className="flex flex-col md:flex-row w-full h-full">
          {/* Left Column - Lead Info */}
          <div className="md:w-1/3 p-8 border-r border-border/10 flex flex-col items-center justify-start space-y-6 bg-gradient-to-b from-background to-muted/10">
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-6 shadow-md border-4 border-background">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {getInitials(lead.name)}
                </AvatarFallback>
              </Avatar>
              
              <motion.h2 
                className="text-2xl font-semibold text-center"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {lead.name}
              </motion.h2>
              
              {lead.email && (
                <motion.p 
                  className="text-muted-foreground text-center mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  {lead.email}
                </motion.p>
              )}
            </div>

            <Badge 
              variant="outline" 
              className={`${findColumnColor(lead.status)} text-background px-3 py-1 text-xs font-medium rounded-full`}
            >
              {lead.status}
            </Badge>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 gap-1.5 text-xs rounded-full bg-background/80 backdrop-blur-sm shadow-sm border-border/30 hover:bg-background"
                onClick={handleViewProfile}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View profile
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="h-9 gap-1.5 text-xs rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                onClick={handleRemoveLead}
                disabled={isRemoving}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove from pipeline
              </Button>
            </div>

            <div className="w-full space-y-5 mt-4">
              {/* Contact Info Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Contact Information</h3>
                
                {lead.email && (
                  <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/20">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="bg-primary/5 p-2 rounded-md">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Email</div>
                        <div className="text-sm font-medium truncate">{lead.email}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {lead.phone && (
                  <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/20">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="bg-primary/5 p-2 rounded-md">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Phone</div>
                        <div className="text-sm font-medium">{lead.phone}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/20">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="bg-primary/5 p-2 rounded-md">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Created on</div>
                      <div className="text-sm font-medium">
                        {format(new Date(lead.created_at), 'MMMM dd, yyyy')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Right Column - Activity Feed & Variables */}
          <div className="md:w-2/3 p-8 space-y-6">
            {/* Activity Section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold">Recent Activity</h3>
              </div>
              
              {activities.length > 0 ? (
                <div className="space-y-3">
                  <ActivityTab activities={activities} />
                </div>
              ) : (
                <Card className="bg-muted/30 border-border/20">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No recent activities found for this lead
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Custom Variables Section */}
            {lead.variables && lead.variables.length > 0 && (
              <div>
                <h3 className="text-base font-semibold mb-4">Lead Variables</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lead.variables.map((variable, index) => (
                    <Card key={index} className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/20">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="bg-primary/5 p-2 rounded-md">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground">{variable.name}</div>
                          <div className="text-sm font-medium truncate">{variable.value}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
