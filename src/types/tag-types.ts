
export type TagColor = 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';

export interface Tag {
  id: string;
  name: string;
  color: TagColor;
}
