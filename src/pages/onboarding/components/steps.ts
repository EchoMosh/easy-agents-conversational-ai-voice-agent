
import type { Step } from "../types";

export const steps: Step[] = [
  {
    id: 1,
    question: "What's your first name?",
    field: "firstName",
    type: "text",
  },
  {
    id: 2,
    question: "And your last name?",
    field: "lastName",
    type: "text",
  },
  {
    id: 3,
    question: "What would you like to name your workspace?",
    field: "workspaceName",
    type: "text",
    description: "This is where you'll manage your leads, agents, and other resources",
  },
  {
    id: 4,
    question: "Choose an icon for your workspace",
    field: "workspaceIcon",
    type: "icon",
    description: "Select an icon that represents your workspace",
    options: ["building", "briefcase", "globe", "house", "factory"],
  },
  {
    id: 5,
    question: "What type of business are you in?",
    field: "businessType",
    type: "select",
    options: [
      "Real Estate",
      "Technology",
      "Healthcare",
      "Finance",
      "Retail",
      "Other",
    ],
  },
  {
    id: 6,
    question: "How many employees do you have?",
    field: "employeeCount",
    type: "select",
    options: ["1-10", "11-50", "51-200", "201-1000", "1000+"],
  },
];
