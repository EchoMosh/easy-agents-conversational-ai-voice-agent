import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import {
  Columns,
  Rows,
  Layout,
  Grid3X3,
  LayoutGrid,
  PanelTop,
  Palette,
  SlidersHorizontal,
  Sparkles,
  Save,
} from "lucide-react";

interface DashboardSettings {
  layout: "grid" | "columns" | "rows";
  columns: number;
  spacing: number;
  cardStyle: "flat" | "raised" | "glass";
  animations: boolean;
  showWelcomeCard: boolean;
  showStatCards: boolean;
  showRecentActivity: boolean;
  showCalendar: boolean;
  chartStyle: "minimal" | "detailed";
  accentColor: string;
  customCards: {
    enabled: boolean;
    order: string[];
  };
  widgetPresets: string;
}

// Card preview component
const CardPreview = ({ style }: { style: string }) => {
  const baseStyles =
    "rounded-lg p-4 h-32 w-full mb-2 flex items-center justify-center text-center";

  if (style === "flat") {
    return (
      <div className={`${baseStyles} bg-card border`}>Flat Card Style</div>
    );
  }

  if (style === "glass") {
    return (
      <div
        className={`${baseStyles} bg-card/80 backdrop-blur border border-primary/20 shadow-sm`}
      >
        Glass Card Style
      </div>
    );
  }

  // Default is raised
  return (
    <div className={`${baseStyles} bg-card border shadow-lg`}>
      Raised Card Style
    </div>
  );
};

// Layout preview component
const LayoutPreview = ({
  type,
  columns,
}: {
  type: string;
  columns: number;
}) => {
  const baseStyles = "bg-muted/50 rounded border border-border";

  if (type === "columns") {
    return (
      <div className="grid grid-cols-3 gap-2 h-32">
        <div className={`${baseStyles} col-span-1`}></div>
        <div className={`${baseStyles} col-span-2`}></div>
      </div>
    );
  }

  if (type === "rows") {
    return (
      <div className="flex flex-col gap-2 h-32">
        <div className={`${baseStyles} h-1/3`}></div>
        <div className={`${baseStyles} h-2/3`}></div>
      </div>
    );
  }

  // Default is grid
  return (
    <div className={`grid grid-cols-${columns} gap-2 h-32`}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={baseStyles}></div>
      ))}
    </div>
  );
};

export function DashboardSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("layout");
  const [settings, setSettings] = useState<DashboardSettings>({
    layout: "grid",
    columns: 2,
    spacing: 16,
    cardStyle: "raised",
    animations: true,
    showWelcomeCard: true,
    showStatCards: true,
    showRecentActivity: true,
    showCalendar: true,
    chartStyle: "minimal",
    accentColor: "#7c3aed", // Default purple accent
    customCards: {
      enabled: false,
      order: ["stats", "activity", "calendar", "welcome"],
    },
    widgetPresets: "default",
  });

  // Load saved settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("dashboard-settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save changes to localStorage
  const saveChanges = () => {
    localStorage.setItem("dashboard-settings", JSON.stringify(settings));

    // Dispatch a custom event so other components can react to the change
    window.dispatchEvent(
      new CustomEvent("dashboard-settings-changed", {
        detail: { settings },
      }),
    );

    toast({
      title: "Dashboard settings saved",
      description: "Your dashboard customization has been applied",
    });
  };

  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-0">
        <div className="flex flex-col space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex">
                <TabsTrigger value="layout" className="flex gap-2 items-center">
                  <Layout size={16} />
                  <span>Layout</span>
                </TabsTrigger>
                <TabsTrigger
                  value="widgets"
                  className="flex gap-2 items-center"
                >
                  <LayoutGrid size={16} />
                  <span>Widgets</span>
                </TabsTrigger>
                <TabsTrigger value="style" className="flex gap-2 items-center">
                  <Palette size={16} />
                  <span>Style</span>
                </TabsTrigger>
              </TabsList>

              <Button onClick={saveChanges} className="w-full md:w-auto gap-2">
                <Save size={16} />
                Save Changes
              </Button>
            </div>

            <TabsContent value="layout" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Dashboard Layout</h3>

                    <RadioGroup
                      value={settings.layout}
                      onValueChange={(value: "grid" | "columns" | "rows") =>
                        setSettings((prev) => ({ ...prev, layout: value }))
                      }
                      className="grid grid-cols-3 gap-4"
                    >
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="grid" id="layout-grid" />
                          <Label
                            htmlFor="layout-grid"
                            className="flex items-center gap-2"
                          >
                            <Grid3X3 size={16} /> Grid
                          </Label>
                        </div>
                        <div className="border rounded p-2 bg-muted/20">
                          <div className="grid grid-cols-2 gap-2 h-20">
                            <div className="bg-muted/50 rounded"></div>
                            <div className="bg-muted/50 rounded"></div>
                            <div className="bg-muted/50 rounded"></div>
                            <div className="bg-muted/50 rounded"></div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="columns" id="layout-columns" />
                          <Label
                            htmlFor="layout-columns"
                            className="flex items-center gap-2"
                          >
                            <Columns size={16} /> Columns
                          </Label>
                        </div>
                        <div className="border rounded p-2 bg-muted/20">
                          <div className="grid grid-cols-3 gap-2 h-20">
                            <div className="bg-muted/50 rounded col-span-1"></div>
                            <div className="bg-muted/50 rounded col-span-2"></div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="rows" id="layout-rows" />
                          <Label
                            htmlFor="layout-rows"
                            className="flex items-center gap-2"
                          >
                            <Rows size={16} /> Rows
                          </Label>
                        </div>
                        <div className="border rounded p-2 bg-muted/20">
                          <div className="flex flex-col gap-2 h-20">
                            <div className="bg-muted/50 rounded h-1/3"></div>
                            <div className="bg-muted/50 rounded h-2/3"></div>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {settings.layout === "grid" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="columns">Columns</Label>
                        <span className="text-sm text-muted-foreground">
                          {settings.columns}
                        </span>
                      </div>
                      <Slider
                        id="columns"
                        min={1}
                        max={4}
                        step={1}
                        value={[settings.columns]}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            columns: value[0],
                          }))
                        }
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="spacing">Widget Spacing</Label>
                      <span className="text-sm text-muted-foreground">
                        {settings.spacing}px
                      </span>
                    </div>
                    <Slider
                      id="spacing"
                      min={0}
                      max={32}
                      step={4}
                      value={[settings.spacing]}
                      onValueChange={(value) =>
                        setSettings((prev) => ({ ...prev, spacing: value[0] }))
                      }
                    />
                  </div>
                </div>

                <div className="border rounded-xl p-6 bg-card">
                  <h3 className="text-lg font-medium mb-4">Layout Preview</h3>
                  <LayoutPreview
                    type={settings.layout}
                    columns={settings.columns}
                  />

                  <div className="mt-6 space-y-4">
                    <h4 className="text-md font-medium">Layout Tips</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li>• Grid works best for equal-sized widgets</li>
                      <li>• Column layout is ideal for sidebar navigation</li>
                      <li>• Row layout places important content at the top</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="widgets" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Widget Visibility</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose which widgets appear on your dashboard
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex flex-col">
                          <Label htmlFor="welcome" className="mb-1">
                            Welcome Card
                          </Label>
                          <span className="text-sm text-muted-foreground">
                            Introductory information and tips
                          </span>
                        </div>
                        <Switch
                          id="welcome"
                          checked={settings.showWelcomeCard}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              showWelcomeCard: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="flex flex-col">
                          <Label htmlFor="stats" className="mb-1">
                            Stat Cards
                          </Label>
                          <span className="text-sm text-muted-foreground">
                            Key metrics and statistics
                          </span>
                        </div>
                        <Switch
                          id="stats"
                          checked={settings.showStatCards}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              showStatCards: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="flex flex-col">
                          <Label htmlFor="activity" className="mb-1">
                            Recent Activity
                          </Label>
                          <span className="text-sm text-muted-foreground">
                            Latest updates and activities
                          </span>
                        </div>
                        <Switch
                          id="activity"
                          checked={settings.showRecentActivity}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              showRecentActivity: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="flex flex-col">
                          <Label htmlFor="calendar" className="mb-1">
                            Calendar Widget
                          </Label>
                          <span className="text-sm text-muted-foreground">
                            Upcoming events and schedule
                          </span>
                        </div>
                        <Switch
                          id="calendar"
                          checked={settings.showCalendar}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              showCalendar: checked,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">
                          Custom Widget Order
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Enable to arrange widgets in a custom order
                        </p>
                      </div>
                      <Switch
                        checked={settings.customCards.enabled}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            customCards: {
                              ...prev.customCards,
                              enabled: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    {settings.customCards.enabled && (
                      <div className="bg-muted/30 p-4 rounded border">
                        <p className="text-sm mb-4">
                          Drag to reorder (coming soon)
                        </p>
                        <div className="space-y-2">
                          {settings.customCards.order.map((widgetId, index) => (
                            <div
                              key={widgetId}
                              className="bg-background flex items-center justify-between p-3 rounded border"
                            >
                              <span className="capitalize">{widgetId}</span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={index === 0}
                                  onClick={() => {
                                    const newOrder = [
                                      ...settings.customCards.order,
                                    ];
                                    [newOrder[index], newOrder[index - 1]] = [
                                      newOrder[index - 1],
                                      newOrder[index],
                                    ];
                                    setSettings((prev) => ({
                                      ...prev,
                                      customCards: {
                                        ...prev.customCards,
                                        order: newOrder,
                                      },
                                    }));
                                  }}
                                >
                                  <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 15 15"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                  >
                                    <path
                                      d="M7.5 3C7.77614 3 8 2.77614 8 2.5C8 2.22386 7.77614 2 7.5 2C7.22386 2 7 2.22386 7 2.5C7 2.77614 7.22386 3 7.5 3ZM7.5 8C7.77614 8 8 7.77614 8 7.5C8 7.22386 7.77614 7 7.5 7C7.22386 7 7 7.22386 7 7.5C7 7.77614 7.22386 8 7.5 8ZM8 12.5C8 12.7761 7.77614 13 7.5 13C7.22386 13 7 12.7761 7 12.5C7 12.2239 7.22386 12 7.5 12C7.77614 12 8 12.2239 8 12.5Z"
                                      fill="currentColor"
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                    ></path>
                                  </svg>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border rounded-xl p-6 bg-card">
                  <h3 className="text-lg font-medium mb-4">Widget Presets</h3>

                  <div className="space-y-3">
                    <Select
                      value={settings.widgetPresets}
                      onValueChange={(value) => {
                        setSettings((prev) => ({
                          ...prev,
                          widgetPresets: value,
                        }));

                        // Apply preset configurations
                        if (value === "productivity") {
                          setSettings((prev) => ({
                            ...prev,
                            showCalendar: true,
                            showStatCards: true,
                            showRecentActivity: true,
                            showWelcomeCard: false,
                          }));
                        } else if (value === "minimal") {
                          setSettings((prev) => ({
                            ...prev,
                            showCalendar: false,
                            showStatCards: true,
                            showRecentActivity: false,
                            showWelcomeCard: false,
                          }));
                        } else if (value === "complete") {
                          setSettings((prev) => ({
                            ...prev,
                            showCalendar: true,
                            showStatCards: true,
                            showRecentActivity: true,
                            showWelcomeCard: true,
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a preset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="productivity">
                          Productivity Focus
                        </SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="complete">
                          Complete Dashboard
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="p-4 bg-muted/20 rounded-lg border mt-4">
                      <h4 className="font-medium mb-2">Preview</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {settings.showWelcomeCard && (
                          <div className="col-span-2 h-20 bg-primary/10 rounded-lg border border-primary/20 flex items-center justify-center text-primary text-sm">
                            Welcome Card
                          </div>
                        )}

                        {settings.showStatCards && (
                          <>
                            <div className="h-16 bg-muted rounded-lg border flex items-center justify-center text-xs">
                              Stats 1
                            </div>
                            <div className="h-16 bg-muted rounded-lg border flex items-center justify-center text-xs">
                              Stats 2
                            </div>
                          </>
                        )}

                        {settings.showRecentActivity && (
                          <div className="col-span-2 h-32 bg-muted rounded-lg border flex items-center justify-center text-sm">
                            Recent Activity
                          </div>
                        )}

                        {settings.showCalendar && (
                          <div className="col-span-2 h-40 bg-muted rounded-lg border flex items-center justify-center text-sm">
                            Calendar
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Card Style</h3>

                    <RadioGroup
                      value={settings.cardStyle}
                      onValueChange={(value: "flat" | "raised" | "glass") =>
                        setSettings((prev) => ({ ...prev, cardStyle: value }))
                      }
                      className="space-y-3"
                    >
                      <div className="flex items-start space-x-4">
                        <RadioGroupItem value="flat" id="style-flat" />
                        <div className="flex-1">
                          <Label htmlFor="style-flat" className="mb-2 block">
                            Flat Design
                          </Label>
                          <CardPreview style="flat" />
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <RadioGroupItem value="raised" id="style-raised" />
                        <div className="flex-1">
                          <Label htmlFor="style-raised" className="mb-2 block">
                            Raised Cards
                          </Label>
                          <CardPreview style="raised" />
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <RadioGroupItem value="glass" id="style-glass" />
                        <div className="flex-1">
                          <Label htmlFor="style-glass" className="mb-2 block">
                            Glass Morphism
                          </Label>
                          <CardPreview style="glass" />
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <Label htmlFor="animations" className="mb-1">
                          Enable Animations
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          Subtle transitions and effects
                        </span>
                      </div>
                      <Switch
                        id="animations"
                        checked={settings.animations}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            animations: checked,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Data Visualization</h3>

                    <RadioGroup
                      value={settings.chartStyle}
                      onValueChange={(value: "minimal" | "detailed") =>
                        setSettings((prev) => ({ ...prev, chartStyle: value }))
                      }
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="minimal" id="chart-minimal" />
                        <Label htmlFor="chart-minimal">Minimal Charts</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="detailed" id="chart-detailed" />
                        <Label htmlFor="chart-detailed">Detailed Charts</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="border rounded-xl p-6 bg-card">
                  <h3 className="text-lg font-medium mb-4">Accent Color</h3>

                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {[
                      "#7c3aed",
                      "#3b82f6",
                      "#10b981",
                      "#f59e0b",
                      "#ef4444",
                      "#ec4899",
                    ].map((color) => (
                      <button
                        key={color}
                        className={`h-10 w-10 rounded-full transition-all ${
                          settings.accentColor === color
                            ? "ring-2 ring-offset-2 ring-ring"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            accentColor: color,
                          }))
                        }
                      />
                    ))}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="custom-color">Custom Color</Label>
                    <Input
                      id="custom-color"
                      type="text"
                      value={settings.accentColor}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          accentColor: e.target.value,
                        }))
                      }
                      placeholder="#7c3aed"
                    />

                    <div
                      className="mt-4 p-4 rounded-lg border"
                      style={{ borderColor: settings.accentColor }}
                    >
                      <div
                        className="h-4 w-full rounded-full mb-2"
                        style={{ backgroundColor: settings.accentColor }}
                      ></div>
                      <div className="flex justify-between">
                        <span className="text-sm">Preview</span>
                        <span
                          className="text-sm"
                          style={{ color: settings.accentColor }}
                        >
                          Accent Text
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
