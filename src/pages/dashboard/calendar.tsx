
import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, isToday, isSameDay } from "date-fns";

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
      return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100";
    case "task":
      return "bg-amber-100 text-amber-800 hover:bg-amber-100";
    case "deadline":
      return "bg-rose-100 text-rose-800 hover:bg-rose-100";
    default:
      return "bg-slate-100 text-slate-800 hover:bg-slate-100";
  }
};

// Function to get dot indicator colors
const getEventIndicatorColor = (type: string) => {
  switch (type) {
    case "meeting":
      return "bg-blue-500";
    case "call":
      return "bg-indigo-500";
    case "task":
      return "bg-amber-500";
    case "deadline":
      return "bg-rose-500";
    default:
      return "bg-slate-500";
  }
};

export default function CalendarPage() {
  const [date, setDate] = useState<Date>(new Date());
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
  };

  // Selected date's events
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  
  // Custom day renderer to show event indicators
  const renderDay = (day: Date) => {
    const dayEvents = getEventsForDate(day);
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isToday(day) ? 'bg-blue-50 font-semibold text-blue-600' : ''}`}>
          {format(day, "d")}
        </div>
        {dayEvents.length > 0 && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
            {dayEvents.slice(0, 3).map((event, index) => (
              <div 
                key={index} 
                className={`w-1.5 h-1.5 rounded-full ${getEventIndicatorColor(event.type)}`}
              />
            ))}
            {dayEvents.length > 3 && (
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            )}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
        <p className="text-muted-foreground">
          Schedule and manage your appointments and events
        </p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border-slate-200 w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-4">
              <CalendarDays className="h-6 w-6 text-slate-500" />
              <CardTitle className="text-xl">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigateMonth("prev")}
                    className="hover:bg-slate-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-medium">{format(date, "MMMM yyyy")}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigateMonth("next")}
                    className="hover:bg-slate-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </div>
            <Button size="sm" variant="outline" className="gap-1 text-slate-700 hover:bg-slate-100 hover:text-slate-900">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </CardHeader>
          <CardContent className="w-full">
            <div className="w-full">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleSelect}
                month={date}
                showOutsideDays
                className="w-full rounded-md border-slate-200"
                components={{
                  Day: ({ date }) => renderDay(date)
                }}
                classNames={{
                  day_today: "bg-blue-50 text-blue-600 font-medium",
                  day_selected: "bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800 focus:bg-blue-100 focus:text-blue-800",
                  months: "w-full flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "w-full space-y-4",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] flex-1 flex justify-center",
                  row: "flex w-full mt-2",
                  cell: "relative h-9 w-full p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
                  day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-slate-50 rounded-full flex items-center justify-center",
                }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              {selectedDate && (
                <>
                  <span className={`w-2 h-2 rounded-full ${isToday(selectedDate) ? 'bg-blue-500' : 'bg-slate-400'}`}></span>
                  <span>{isToday(selectedDate) ? 'Today' : format(selectedDate, "EEEE")}</span>
                </>
              )}
            </CardTitle>
            <div className="font-medium text-lg text-slate-700">
              {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "No date selected"}
            </div>
            <div className="text-sm text-slate-500 font-normal">
              {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'event' : 'events'}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger value="upcoming">Events</TabsTrigger>
                <TabsTrigger value="all">Schedule</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="space-y-4">
                {selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 py-2 group hover:bg-slate-50 px-2 rounded-md transition-colors">
                      <div className={`w-1 self-stretch rounded-full ${getEventIndicatorColor(event.type)}`}></div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800">{event.title}</span>
                          <Badge className={`${getEventBadgeColor(event.type)} text-xs`}>
                            {event.type}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500">
                          {format(event.date, "h:mm a")}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                    <p className="text-sm text-slate-500">
                      No events scheduled for this day
                    </p>
                    <Button size="sm" variant="outline" className="mt-4 text-slate-700 hover:bg-slate-100">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Event
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="all" className="h-[260px] flex flex-col items-center justify-center text-center p-4">
                <div className="text-slate-400">
                  <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-slate-500">
                    Full schedule view coming soon
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
