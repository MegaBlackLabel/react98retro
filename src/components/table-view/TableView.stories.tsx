import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TableView, type TableViewProps } from './TableView';

type FileRow = {
  id: string;
  name: string;
  size: string;
  type: string;
  modified: string;
};

const rows: FileRow[] = [
  { id: '1', name: 'autoexec.bat', size: '12 KB', type: 'MS-DOS Batch', modified: '8/24/98' },
  { id: '2', name: 'config.sys', size: '4 KB', type: 'System File', modified: '8/24/98' },
  { id: '3', name: 'readme.txt', size: '1 KB', type: 'Text Document', modified: '8/24/98' },
];

const meta = {
  title: 'Components/TableView',
  component: TableView,
  tags: ['autodocs'],
  args: {
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'size', header: 'Size' },
      { key: 'type', header: 'Type' },
      { key: 'modified', header: 'Modified' },
    ],
    rows,
  },
} satisfies Meta<TableViewProps<FileRow>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FileList: Story = {};

export const MultiSelectDemo: Story = {
  render: (args) => {
    const [selectedIds, setSelectedIds] = useState<string[]>(['1']);

    return (
      <TableView
        {...args}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    );
  },
};
