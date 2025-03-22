declare module '*.csv' {
  const content: string;
  export default content;
}

declare module './file-uploader' {
  import { FC } from 'react';
  interface FileUploaderProps {
    onFileSelect: (file: File, content: string) => void;
    isLoading: boolean;
  }
  export const FileUploader: FC<FileUploaderProps>;
}

declare module './column-mapper' {
  import { FC } from 'react';
  interface ColumnMapperProps {
    fileContent: string;
    fileName: string;
    hasHeaders: boolean;
    setHasHeaders: (value: boolean) => void;
    removeDuplicates: boolean;
    setRemoveDuplicates: (value: boolean) => void;
    columnMapping: Record<string, string>;
    setColumnMapping: (mapping: Record<string, string>) => void;
    onNext: () => void;
    onBack: () => void;
  }
  export const ColumnMapper: FC<ColumnMapperProps>;
}
