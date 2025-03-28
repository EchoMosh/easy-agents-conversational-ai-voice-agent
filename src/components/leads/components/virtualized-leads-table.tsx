import { useRef, useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Table,
  TableBody,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Lead } from "@/pages/dashboard/leads";
import { LeadRow } from "./lead-row";
import { LeadTableHeader } from "./lead-table-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VirtualizedLeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  onLeadUpdated: () => void;
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  selectedLeads: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  isDeleting: boolean;
  selectAllMode: "visible" | "all";
  visibleCount: number;
  totalCount: number | null;
  pipelines: Array<{ id: string; name: string }>;
}

export function VirtualizedLeadsTable({
  leads,
  isLoading,
  onLeadUpdated,
  hasMore,
  onLoadMore,
  selectedLeads,
  onToggleSelect,
  onToggleSelectAll,
  isAllSelected,
  isDeleting,
  selectAllMode,
  visibleCount,
  totalCount,
  pipelines,
}: VirtualizedLeadsTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tableHeight, setTableHeight] = useState("calc(100vh - 200px)");

  // Create a virtualizer for the table rows
  const rowVirtualizer = useVirtualizer({
    count: leads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 5, // Number of items to render outside of the visible area
  });

  // Get pipeline names for each lead
  const getPipelineName = (pipelineId: string | null | undefined) => {
    if (!pipelineId) return "No Pipeline";
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    return pipeline?.name || "Unknown";
  };

  // Handle loading more data
  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    setLoadError(null);

    try {
      await onLoadMore();
    } catch (error) {
      console.error("Error loading more leads:", error);
      setLoadError("Failed to load data. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Use effect to make sure the height is calculated correctly
  useEffect(() => {
    // Update table height when the window is resized
    const handleResize = () => {
      // Calculate available height for the table based on other UI elements
      // This is the key to making the table the only scrollable element
      setTableHeight(`calc(100vh - 200px)`); // Adjust this value based on actual header/footer height
    };

    // Initial call
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Log table info for debugging
  useEffect(() => {
    console.log(`🔍 VirtualizedLeadsTable - Rendering ${leads.length} leads`);
  }, [leads.length]);

  return (
    <div className="border rounded-lg overflow-hidden w-full flex flex-col">
      <div className="overflow-x-auto flex-grow flex flex-col">
        <Table className="w-full flex flex-col h-full">
          {/* Table header is fixed/sticky */}
          <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
            <LeadTableHeader
              onToggleSelectAll={onToggleSelectAll}
              isAllSelected={isAllSelected}
              isDeleting={isDeleting}
              selectAllMode={selectAllMode}
              visibleCount={visibleCount}
              totalCount={totalCount}
            />
          </TableHeader>

          {/* Table body is the only scrollable part */}
          <TableBody className="flex-grow flex-1 relative">
            <TableRow className="flex-grow flex-1">
              <td colSpan={7} className="p-0 h-full">
                <div
                  ref={parentRef}
                  className="overflow-y-auto scrollbar-thin"
                  style={{
                    height: tableHeight,
                    maxHeight: tableHeight,
                    minHeight: "400px",
                  }}
                >
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr
                        style={{
                          height: rowVirtualizer
                            ? `${rowVirtualizer.getTotalSize()}px`
                            : "auto",
                        }}
                      >
                        <td className="p-0">
                          <div className="w-full relative">
                            {rowVirtualizer &&
                              rowVirtualizer
                                .getVirtualItems()
                                .map((virtualRow) => {
                                  const lead = leads[virtualRow.index];

                                  if (!lead) return null;

                                  return (
                                    <div
                                      key={lead.id}
                                      style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                      }}
                                      className="lead-row-container w-full"
                                    >
                                      <table className="w-full border-collapse">
                                        <tbody>
                                          <LeadRow
                                            lead={{
                                              ...lead,
                                              onVariableClick: (lead) => {
                                                if (
                                                  typeof window !== "undefined"
                                                ) {
                                                  const event = new CustomEvent(
                                                    "editLead",
                                                    {
                                                      detail: lead,
                                                    }
                                                  );
                                                  window.dispatchEvent(event);
                                                }
                                              },
                                              onEditClick: (lead) => {
                                                if (
                                                  typeof window !== "undefined"
                                                ) {
                                                  const event = new CustomEvent(
                                                    "editLead",
                                                    {
                                                      detail: lead,
                                                    }
                                                  );
                                                  window.dispatchEvent(event);
                                                }
                                              },
                                            }}
                                            isSelected={
                                              selectedLeads.includes(lead.id) ||
                                              (selectAllMode === "all" &&
                                                !selectedLeads.includes(
                                                  lead.id
                                                ))
                                            }
                                            onToggleSelect={onToggleSelect}
                                            onLeadUpdated={onLeadUpdated}
                                            isDeleting={isDeleting}
                                            pipelineName={getPipelineName(
                                              lead.pipeline_id
                                            )}
                                          />
                                        </tbody>
                                      </table>
                                    </div>
                                  );
                                })}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </TableRow>
          </TableBody>

          {/* Table footer is fixed/sticky at the bottom */}
          <TableFooter className="bg-background border-t sticky bottom-0 z-10">
            <TableRow>
              <td colSpan={7} className="p-4 bg-muted/10">
                {loadError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{loadError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {leads.length}{" "}
                    {totalCount ? `of ${totalCount}` : ""} records
                  </div>

                  {hasMore && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="gap-2 font-medium px-4 py-2"
                    >
                      {isLoadingMore ? (
                        <>
                          <LoadingSpinner className="h-4 w-4" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          <span>Load More</span>
                        </>
                      )}
                    </Button>
                  )}

                  {!hasMore && leads.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      All records loaded
                    </div>
                  )}

                  {leads.length === 0 && !isLoading && (
                    <div className="text-sm text-muted-foreground">
                      No records found
                    </div>
                  )}
                </div>
              </td>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
