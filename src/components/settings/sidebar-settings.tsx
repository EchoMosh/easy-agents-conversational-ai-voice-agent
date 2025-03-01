
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { mainMenuItems } from "@/components/dashboard/sidebar/navigation-menu";
import { GripVertical, Users, Target, GitMerge, MessageSquare, Book, Zap } from "lucide-react";

// Define the sidebar item type with icon
interface SidebarItem {
  id: string;
  title: string;
  visible: boolean;
  icon: string;
}

// Get all available icons from lucide-react
const availableIcons: Record<string, any> = {
  Users, Target, GitMerge, MessageSquare, Book, Zap
};

// Sortable item component
const SortableItem = ({ 
  item, 
  onToggleVisibility, 
  onIconChange 
}: { 
  item: SidebarItem; 
  onToggleVisibility: (id: string) => void;
  onIconChange: (id: string, icon: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const IconComponent = availableIcons[item.icon] || Users;
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center p-2 border rounded-md bg-background mb-2"
    >
      <div {...attributes} {...listeners} className="mr-3 text-muted-foreground cursor-grab">
        <GripVertical size={18} />
      </div>
      <div className="flex items-center flex-1 gap-2">
        <Checkbox
          id={`visible-${item.id}`}
          checked={item.visible}
          onCheckedChange={() => onToggleVisibility(item.id)}
        />
        <Label htmlFor={`visible-${item.id}`} className="cursor-pointer flex-1">
          {item.title}
        </Label>
        <div className="flex items-center">
          <IconComponent size={18} className="mx-2 text-muted-foreground" />
          <Select
            value={item.icon}
            onValueChange={(value) => onIconChange(item.id, value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  <span>Users</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.keys(availableIcons).map((iconName) => {
                const Icon = availableIcons[iconName];
                return (
                  <SelectItem key={iconName} value={iconName}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{iconName}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export function SidebarSettings() {
  const { toast } = useToast();
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
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
        visible: true,
        icon: item.icon.name || 'Users' // Default to Users if no name property
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

  // Change icon of an item
  const changeItemIcon = (id: string, icon: string) => {
    setSidebarItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, icon } : item
      )
    );
  };

  // Handle item reordering
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setSidebarItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sidebar Customization</CardTitle>
        <CardDescription>
          Choose which items appear in your sidebar, their order, and icons
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Drag items to reorder them, toggle visibility with the checkbox, or change icons
            </p>
          </div>
          
          <div className="space-y-2">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={sidebarItems.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div>
                  {sidebarItems.map((item) => (
                    <SortableItem 
                      key={item.id} 
                      item={item} 
                      onToggleVisibility={toggleItemVisibility} 
                      onIconChange={changeItemIcon}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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
