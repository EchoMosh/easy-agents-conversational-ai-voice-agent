
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/pages/dashboard/leads";
import { format } from "date-fns";
import { PipelineColumn } from "@/types/pipeline";
import { Mail, Phone, Calendar, User, ExternalLink, Trash2, Activity, X, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

interface LeadDetailsDialogProps {
  lead: Lead | null;
  onClose: () => void;
  columns: PipelineColumn[];
}

interface Activity {
  id: string;
  type: 'email' | 'sms' | 'status';
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
      
      // Transform to the format expected by ActivityTab
      const formattedActivities = (data || []).map(activity => ({
        id: activity.id,
        type: activity.content.toLowerCase().includes('email') 
          ? 'email' as const 
          : activity.content.toLowerCase().includes('status') 
            ? 'status' as const 
            : 'sms' as const,
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
    // Update to navigate directly to the chat page with the lead ID
    navigate(`/dashboard/chats/${lead.id}`);
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

  const formatActivityTime = (timestamp: string) => {
    return format(new Date(timestamp), 'MMM d, h:mm a');
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'status':
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={!!lead} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-hidden sm:max-w-3xl max-h-[85vh] bg-background/95 backdrop-blur-sm border-none shadow-xl rounded-xl">
        <div className="flex flex-col h-full">
          {/* Header - Contact Info */}
          <div className="p-6 relative">
            <div className="absolute top-3 right-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="h-8 w-8 rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-5">
              <Avatar className="h-16 w-16 shadow-sm border-2 border-background">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                  {getInitials(lead.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">{lead.name}</h2>
                  {lead.status && (
                    <Badge 
                      variant="outline" 
                      className={`${findColumnColor(lead.status)} text-background px-2.5 py-0.5 text-xs rounded-full`}
                    >
                      {lead.status}
                    </Badge>
                  )}
                  {lead.is_new && (
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 text-xs rounded-full">
                      New
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center mt-1 gap-5">
                  {lead.email && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {lead.email}
                    </span>
                  )}
                  
                  {lead.phone && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {lead.phone}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 gap-1 text-xs rounded-lg bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background"
                  onClick={handleViewProfile}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Profile
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-9 gap-1 text-xs rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                  onClick={handleRemoveLead}
                  disabled={isRemoving}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove from Pipeline
                </Button>
              </div>
            </div>

            <div className="flex items-center mt-3 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1.5" />
              <span>Created on {format(new Date(lead.created_at), 'MMMM d, yyyy')}</span>
            </div>
          </div>
          
          <Separator />
          
          {/* Main Content */}
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Activity Feed */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-medium">Activity History</h3>
                </div>
              </div>
              
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30"
                    >
                      <div className={`rounded-full p-2 ${
                        activity.type === 'email' 
                          ? 'bg-blue-100 text-blue-600' 
                          : activity.type === 'status'
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-green-100 text-green-600'
                      }`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.content}</p>
                        <time className="text-xs text-muted-foreground">
                          {formatActivityTime(activity.timestamp)}
                        </time>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/30 border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No recent activities found for this lead
                  </p>
                </Card>
              )}
            </div>
            
            {/* Custom Variables Section */}
            {lead.variables && lead.variables.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-medium">Lead Variables</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {lead.variables.map((variable, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="bg-primary/5 p-2 rounded-md">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">{variable.name}</div>
                        <div className="text-sm font-medium truncate">{variable.value}</div>
                      </div>
                    </motion.div>
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
