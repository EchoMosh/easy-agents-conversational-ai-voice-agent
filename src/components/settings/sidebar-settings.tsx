
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DragDropContext, Droppable, Draggable } from "@dnd-kit/core";
import { mainMenuItems } from "@/components/dashboard/sidebar/navigation-menu";
import { GripVertical } from "lucide-react";

// Define the sidebar item type
interface SidebarItem {
  id: string;
  title: string;
  visible: boolean;
}

export function SidebarSettings() {
  const { toast } = useToast();
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  
  // Load saved settings on component mount
  useEffect(() => {
    const savedItems = localStorage.getItem('sidebar-settings');
    if (savedItems) {
      setSidebarItems(JSON.parse(savedItems));
    } else {
      // Initialize with default items from navigation menu
      const defaultItems = mainMenuItems.map(item => ({
        id: item.title.toLowerCase(),
        title: item.title,
        visible: true
      }));
      setSidebarItems(defaultItems);
    }
  }, []);

  // Save changes to localStorage and update global state
  const saveChanges = () => {
    localStorage.setItem('sidebar-settings', JSON.stringify(sidebarItems));
    
    // Dispatch a custom event so other components can react to the change
    window.dispatchEvent(new CustomEvent('sidebar-settings-changed', { 
      detail: { items: sidebarItems } 
    }));
    
    toast({
      title: "Settings saved",
      description: "Your sidebar customization has been saved",
    });
  };

  // Toggle visibility of an item
  const toggleItemVisibility = (id: string) => {
    setSidebarItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, visible: !item.visible } : item
      )
    );
  };

  // Handle item reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(sidebarItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setSidebarItems(items);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sidebar Customization</CardTitle>
        <CardDescription>
          Choose which items appear in your sidebar and their order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Drag items to reorder them or toggle visibility with the checkbox
            </p>
          </div>
          
          <div className="space-y-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sidebar-items">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {sidebarItems.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center p-2 border rounded-md bg-background"
                          >
                            <div {...provided.dragHandleProps} className="mr-3 text-muted-foreground">
                              <GripVertical size={18} />
                            </div>
                            <div className="flex items-center flex-1 space-x-3">
                              <Checkbox
                                id={`visible-${item.id}`}
                                checked={item.visible}
                                onCheckedChange={() => toggleItemVisibility(item.id)}
                              />
                              <Label htmlFor={`visible-${item.id}`} className="cursor-pointer flex-1">
                                {item.title}
                              </Label>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-end">
            <Button onClick={saveChanges}>
              Save Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
