
export type OnboardingData = {
  firstName: string;
  lastName: string;
  workspaceName: string;
  workspaceIcon: string;
  businessType: string;
  employeeCount: string;
};

export type Step = {
  id: number;
  question: string;
  field: keyof OnboardingData;
  type: "text" | "select" | "icon";
  description?: string;
  options?: string[];
};
