import React from 'react';
import { createEditor, type Descendant, type BaseEditor } from 'slate';
import { Slate, Editable, withReact, type ReactEditor } from 'slate-react';
import { withHistory, type HistoryEditor } from 'slate-history';

type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

interface RichTextBlockProps {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
  placeholder?: string;
}

const RichTextBlock: React.FC<RichTextBlockProps> = ({ value, onChange, placeholder }) => {
  const [editor] = React.useState<CustomEditor>(() => withHistory(withReact(createEditor())));

  // Initialize with an empty paragraph if value is empty
  const initialValue = value && value.length > 0 
    ? value 
    : [{ type: 'paragraph', children: [{ text: '' }] }];

  return (
    <div className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
      <Slate
        editor={editor}
        initialValue={initialValue}
        onChange={onChange}
      >
        <Editable
          placeholder={placeholder}
          className="min-h-[80px] focus:outline-none"
        />
      </Slate>
    </div>
  );
};

export default RichTextBlock;