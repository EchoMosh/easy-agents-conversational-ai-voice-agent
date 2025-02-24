
export type OnboardingData = {
  firstName: string;
  lastName: string;
  workspaceName: string;
  businessType: string;
  employeeCount: string;
};

export type Step = {
  id: number;
  question: string;
  field: keyof OnboardingData;
  type: "text" | "number" | "select";
  options?: string[];
  description?: string;
};
