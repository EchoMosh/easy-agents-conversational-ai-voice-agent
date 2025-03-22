import React, { useState } from "react";
import { Check, Info, Plus, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TagSelectorProps {
  fileName: string;
  leadCount: number; // Estimated number of leads to be imported
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

// Mock available tags - in a real app, these would come from an API or state
const AVAILABLE_TAGS = [
  { id: "1", name: "Cold Lead", color: "bg-blue-100 text-blue-800" },
  { id: "2", name: "Hot Lead", color: "bg-red-100 text-red-800" },
  { id: "3", name: "New Contact", color: "bg-green-100 text-green-800" },
  { id: "4", name: "Follow Up", color: "bg-amber-100 text-amber-800" },
  {
    id: "5",
    name: "Meeting Scheduled",
    color: "bg-purple-100 text-purple-800",
  },
  { id: "6", name: "Decision Maker", color: "bg-indigo-100 text-indigo-800" },
  { id: "7", name: "Potential Customer", color: "bg-cyan-100 text-cyan-800" },
  {
    id: "8",
    name: "Existing Customer",
    color: "bg-emerald-100 text-emerald-800",
  },
];

export function TagSelector({
  fileName,
  leadCount,
  selectedTags,
  setSelectedTags,
  onNext,
  onBack,
}: TagSelectorProps) {
  const [newTagName, setNewTagName] = useState("");
  const [showCreateTag, setShowCreateTag] = useState(false);

  // Handle tag selection
  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((id) => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  // Handle creating a new tag
  const handleCreateTag = () => {
    if (newTagName.trim()) {
      // In a real app, you would call an API to create the tag first
      // For now, we'll just simulate adding it to selected tags

      // Create a mock new tag with a random ID
      const newTagId = `new-${Date.now()}`;
      const newTag = {
        id: newTagId,
        name: newTagName.trim(),
        color: "bg-gray-100 text-gray-800", // Default color for new tags
      };

      // Add the new tag to the available tags (in a real app, this would be handled by state management)
      // @ts-ignore - This is just for demo purposes
      AVAILABLE_TAGS.push(newTag);

      // Select the new tag
      setSelectedTags([...selectedTags, newTagId]);

      // Reset form
      setNewTagName("");
      setShowCreateTag(false);
    }
  };

  // Display truncated filename
  const displayFileName =
    fileName.length > 40 ? fileName.substring(0, 37) + "..." : fileName;

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 mb-4">
        <div className="text-center text-sm text-gray-500">
          <span className="text-xs uppercase tracking-wider font-medium">
            File:
          </span>{" "}
          {displayFileName}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto">
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Add Tags to Your Imported Leads
          </h3>
          <p className="text-gray-500 mb-2">
            Adding tags will help you categorize and filter your leads later.
            You're about to import approximately <strong>{leadCount}</strong>{" "}
            leads.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start">
            <Info className="text-blue-500 h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700 ml-3">
              Tags will be applied to all leads in this import. You can always
              add or remove tags later.
            </p>
          </div>
        </div>

        {/* Tag Selection Grid */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-700">Select Tags</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
              onClick={() => setShowCreateTag(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create New Tag
            </Button>
          </div>

          {/* Tag Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AVAILABLE_TAGS.map((tag) => (
              <div
                key={tag.id}
                className={`px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                  selectedTags.includes(tag.id)
                    ? "border-indigo-300 bg-indigo-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
                onClick={() => toggleTag(tag.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Tag className="h-3.5 w-3.5 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      {tag.name}
                    </span>
                  </div>
                  {selectedTags.includes(tag.id) && (
                    <div className="h-4 w-4 bg-indigo-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Tag Form */}
        {showCreateTag && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">
                Create New Tag
              </h4>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowCreateTag(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-grow px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Tag name"
              />
              <Button
                type="button"
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className={`px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  !newTagName.trim() && "opacity-50 cursor-not-allowed"
                }`}
              >
                Create
              </Button>
            </div>
          </div>
        )}

        {/* Selected Tags Preview */}
        {selectedTags.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Selected Tags ({selectedTags.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tagId) => {
                const tag = AVAILABLE_TAGS.find((t) => t.id === tagId);
                if (!tag) return null;
                return (
                  <Badge
                    key={tag.id}
                    className={`${tag.color} px-2 py-1 rounded-full`}
                  >
                    {tag.name}
                    <button
                      type="button"
                      className="ml-1 text-gray-500 hover:text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTag(tag.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Footer with Navigation Buttons */}
      <div className="flex-shrink-0 pt-4 border-t mt-auto">
        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Back
          </button>

          <button
            onClick={onNext}
            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {selectedTags.length > 0 ? "Import with Tags" : "Skip Tagging"}
          </button>
        </div>
      </div>
    </div>
  );
}
