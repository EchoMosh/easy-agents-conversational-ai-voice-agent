import { useEffect } from 'react';

/**
 * Hook to set the document title
 * @param title The title to set
 * @param dependencies Optional dependencies array to control when the title updates
 */
export const useDocumentTitle = (
  title: string,
  dependencies: React.DependencyList = []
) => {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = title;

    return () => {
      document.title = originalTitle;
    };
  }, [title, ...dependencies]);
};
