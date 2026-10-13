import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toolbar } from './Toolbar';
import { ToolbarBand } from './ToolbarBand';
import { ToolbarRow } from './ToolbarRow';
import { useToolbarRows } from './useToolbarRows';
import type { ToolbarItemDef } from './Toolbar';
import { ICONS } from '../../icons/icons';

const meta: Meta<typeof ToolbarBand> = {
  title: 'Components/ToolbarBand',
  component: ToolbarBand,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ToolbarBand>;

const button = (id: string, icon: string, label: string): ToolbarItemDef => ({
  type: 'button',
  id,
  icon,
  label,
  tooltip: label,
  onClick: () => {},
});

/** ドッキング ツールバーのグループ。段に詰める単位。 */
const groups: ToolbarItemDef[][] = [
  [button('back', ICONS.back, 'Back'), button('forward', ICONS.forward, 'Forward')],
  [button('up', ICONS.up, 'Up')],
  [button('cut', ICONS.cut, 'Cut'), button('copy', ICONS.copy, 'Copy')],
  [button('paste', ICONS.paste, 'Paste'), button('delete', ICONS.delete, 'Delete')],
  [button('shellWindow', ICONS.shellWindow, 'Shell'), button('properties', ICONS.properties, 'Properties')],
];

/** 1 段だけの帯。外周の溝 (上辺の明 1px / 下辺の暗 2px) だけが付く。 */
export const SingleRow: Story = {
  render: () => (
    <ToolbarBand
      rows={[
        <ToolbarRow key="row">
          <Toolbar variant="band" items={groups[0]} />
        </ToolbarRow>,
      ]}
    />
  ),
};

/** 折り返した帯。幅に合わせて段に詰め直す (`useToolbarRows`)。 */
export const Wrapped: Story = {
  render: () => {
    const { stripRef, itemRefs, rows } = useToolbarRows({ count: groups.length, gap: 2 });

    return (
      <div style={{ width: 200 }}>
        <ToolbarBand
          ref={stripRef}
          rows={rows.map((row) => (
            <ToolbarRow key={row[0]}>
              {row.map((index) => (
                <Toolbar
                  key={index}
                  variant="band"
                  items={groups[index]}
                  ref={(element: HTMLDivElement | null) => {
                    itemRefs.current[index] = element;
                  }}
                />
              ))}
            </ToolbarRow>
          ))}
        />
      </div>
    );
  },
};
