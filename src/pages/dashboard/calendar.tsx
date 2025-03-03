
import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";

// Sample events data
const events = [
  { id: 1, title: "Team Meeting", date: new Date(2023, 5, 15), type: "meeting" },
  { id: 2, title: "Client Call", date: new Date(2023, 5, 22), type: "call" },
  { id: 3, title: "Follow-up", date: new Date(2023, 5, 18), type: "task" },
  { id: 4, title: "Deadline", date: new Date(2023, 5, 30), type: "deadline" },
];

// Function to get events for a specific date
const getEventsForDate = (date: Date) => {
  return events.filter(
    (event) => 
      event.date.getDate() === date.getDate() && 
      event.date.getMonth() === date.getMonth() && 
      event.date.getFullYear() === date.getFullYear()
  );
};

// Function to get badge color based on event type
const getEventBadgeColor = (type: string) => {
  switch (type) {
    case "meeting":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "call":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "task":
      return "bg-amber-100 text-amber-800 hover:bg-amber-100";
    case "deadline":
      return "bg-rose-100 text-rose-800 hover:bg-rose-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

export default function CalendarPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<"month" | "events">("month");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Handler for month navigation
  const navigateMonth = (direction: "next" | "prev") => {
    if (direction === "next") {
      setDate(addMonths(date, 1));
    } else {
      setDate(subMonths(date, 1));
    }
  };

  // Handler for date selection
  const handleSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setView("events");
    }
  };

  // Selected date's events
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
        <p className="text-muted-foreground">
          Schedule and manage your appointments and events
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigateMonth("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>{format(date, "MMMM yyyy")}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigateMonth("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
            <Button size="sm" variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              month={date}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Events"}
            </CardTitle>
            <CardDescription>
              {selectedDateEvents.length} events scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="space-y-4 pt-4">
                {selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map((event) => (
                    <div key={event.id} className="flex flex-col space-y-1 border-b pb-3 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{event.title}</span>
                        <Badge className={getEventBadgeColor(event.type)}>
                          {event.type}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(event.date, "h:mm a")}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex h-[140px] flex-col items-center justify-center rounded-md border border-dashed p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No events scheduled for this day
                    </p>
                    <Button size="sm" variant="outline" className="mt-4">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Event
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="past" className="flex h-[200px] flex-col items-center justify-center text-center">
                <p className="text-sm text-muted-foreground">
                  Past events will be displayed here
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
