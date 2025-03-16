
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
import { mainMenuItems } from "@/components/dashboard/sidebar";
import { 
  GripVertical, 
  Users, 
  Target, 
  GitMerge, 
  MessageSquare, 
  Book, 
  Zap, 
  Settings,
  ChevronDown,
  ChevronUp, 
  ChevronLeft, 
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Define the sidebar item type with icon
interface SidebarItem {
  id: string;
  title: string;
  visible: boolean;
  icon: string;
  subItems?: SidebarItem[];
}

// Get all available icons from lucide-react
const availableIcons: Record<string, any> = {
  Users, 
  Target, 
  GitMerge, 
  MessageSquare, 
  Book, 
  Zap, 
  Settings,
  ChevronDown,
  ChevronUp, 
  ChevronLeft, 
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
};

// Sortable item component
const SortableItem = ({ 
  item, 
  onToggleVisibility, 
  onIconChange,
  level = 0
}: { 
  item: SidebarItem; 
  onToggleVisibility: (id: string, parentId?: string) => void;
  onIconChange: (id: string, icon: string, parentId?: string) => void;
  level?: number;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [showSubItems, setShowSubItems] = useState(false);
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const IconComponent = availableIcons[item.icon] || Users;
  
  // Filter icons based on search
  const filteredIcons = Object.keys(availableIcons).filter(iconName => 
    iconName.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div>
      <div 
        ref={setNodeRef} 
        style={style} 
        className={`flex items-center p-2 border rounded-md bg-background mb-2 ${level > 0 ? 'ml-6' : ''}`}
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
            
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  role="combobox" 
                  aria-expanded={open}
                  className="w-[120px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <span>{item.icon}</span>
                  </div>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="end">
                <Command>
                  <CommandInput 
                    placeholder="Search icons..." 
                    value={search}
                    onValueChange={setSearch}
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No icons found.</CommandEmpty>
                    <CommandGroup>
                      {filteredIcons.map((iconName) => {
                        const Icon = availableIcons[iconName];
                        return (
                          <CommandItem
                            key={iconName}
                            value={iconName}
                            onSelect={() => {
                              onIconChange(item.id, iconName);
                              setOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{iconName}</span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          {item.subItems && item.subItems.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSubItems(!showSubItems)}
              className="p-0 h-8 w-8"
            >
              {showSubItems ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          )}
        </div>
      </div>

      {/* Render sub-items if expanded */}
      {item.subItems && showSubItems && (
        <div className="pl-6">
          {item.subItems.map(subItem => (
            <SortableItem
              key={subItem.id}
              item={subItem}
              onToggleVisibility={(id) => onToggleVisibility(id, item.id)}
              onIconChange={(id, icon) => onIconChange(id, icon, item.id)}
              level={level + 1}
            />
          ))}
        </div>
      )}
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
    const loadSavedSettings = () => {
      const savedItems = localStorage.getItem('sidebar-settings');
      if (savedItems) {
        setSidebarItems(JSON.parse(savedItems));
      } else {
        // Initialize with default items from navigation menu
        const defaultItems = mainMenuItems.map(item => ({
          id: item.title.toLowerCase(),
          title: item.title,
          visible: true,
          icon: item.icon.name || 'Users', // Default to Users if no name property
          subItems: item.subItems?.map(subItem => ({
            id: subItem.title.toLowerCase(),
            title: subItem.title,
            visible: true,
            icon: subItem.icon.name || 'Book'
          }))
        }));
        setSidebarItems(defaultItems);
      }
    };

    loadSavedSettings();
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
  const toggleItemVisibility = (id: string, parentId?: string) => {
    if (parentId) {
      // Toggle visibility of a sub-item
      setSidebarItems(prev => 
        prev.map(item => 
          item.id === parentId
            ? { 
                ...item, 
                subItems: item.subItems?.map(subItem => 
                  subItem.id === id 
                    ? { ...subItem, visible: !subItem.visible } 
                    : subItem
                )
              }
            : item
        )
      );
    } else {
      // Toggle visibility of a main item
      setSidebarItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, visible: !item.visible } : item
        )
      );
    }
  };

  // Change icon of an item
  const changeItemIcon = (id: string, icon: string, parentId?: string) => {
    if (parentId) {
      // Change icon of a sub-item
      setSidebarItems(prev => 
        prev.map(item => 
          item.id === parentId
            ? { 
                ...item, 
                subItems: item.subItems?.map(subItem => 
                  subItem.id === id 
                    ? { ...subItem, icon } 
                    : subItem
                )
              }
            : item
        )
      );
    } else {
      // Change icon of a main item
      setSidebarItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, icon } : item
        )
      );
    }
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
