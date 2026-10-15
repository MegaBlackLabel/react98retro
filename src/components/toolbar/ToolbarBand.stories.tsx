import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toolbar } from './Toolbar';
import { ToolbarBand } from './ToolbarBand';
import { ToolbarRow } from './ToolbarRow';
import { useToolbarRows } from './useToolbarRows';
import { useToolbarReorder } from './useToolbarReorder';
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

/**
 * グリップで並べ替えられる帯 (フェーズ 1: 同じ段の中)。
 *
 * グループの左端のグリップをドラッグすると、その場で順序が入れ替わる。
 * 「Properties」のグループは動かせない例 (`movable: false` + `grip={false}`)。
 * 実物の rebar では、グリップが無いバンドは掴めないので並べ替えできない
 * (`RBBS_NOGRIPPER`)。
 */
export const Reorderable: Story = {
  render: () => {
    const labels = ['Back/Forward', 'Up', 'Cut/Copy', 'Paste/Delete', 'Properties(固定)'];
    const [order, setOrder] = useState(() => groups.map((_, index) => index));
    const movable = [true, true, true, true, false];
    const { itemRefs, draggingIndex, dropIndex, getHandleProps, canReorder } = useToolbarReorder({
      count: groups.length,
      movable,
      onReorder: (from, to) =>
        setOrder((prev) => {
          const next = [...prev];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return next;
        }),
    });

    return (
      <div style={{ width: 520 }}>
        <ToolbarBand
          rows={[
            <ToolbarRow key="row" data-testid="reorder-row">
              {order.map((groupIndex, position) => (
                <Toolbar
                  key={groupIndex}
                  variant="band"
                  items={groups[groupIndex]}
                  grip={movable[position]}
                  gripProps={canReorder(position) ? getHandleProps(position) : undefined}
                  ref={(element: HTMLDivElement | null) => {
                    itemRefs.current[position] = element;
                  }}
                  data-testid={`reorder-group-${groupIndex}`}
                  data-dragging={draggingIndex === position ? '' : undefined}
                  data-drop={dropIndex === position && draggingIndex !== position ? '' : undefined}
                  style={{
                    opacity: draggingIndex === position ? 0.5 : undefined,
                    boxShadow: dropIndex === position && draggingIndex !== position ? 'inset 2px 0 0 #000080' : undefined,
                  }}
                  aria-label={labels[groupIndex]}
                />
              ))}
            </ToolbarRow>,
          ]}
        />
      </div>
    );
  },
};

/**
 * 段をまたいで並べ替えられる帯 (フェーズ 2)。`allowCrossRow: true`。
 *
 * 幅を狭くして 2 段に折り返させている。グリップを掴んで**別の段**へ持っていくと、
 * ポインタの y が入っている段の挿入位置に移動する。段分けはドロップ後に
 * `useToolbarRows` が測って詰め直す。
 */
export const ReorderableAcrossRows: Story = {
  render: () => {
    const [order, setOrder] = useState(() => groups.map((_, index) => index));
    const movable = [true, true, true, true, false];
    const { stripRef, itemRefs, rows } = useToolbarRows({ count: groups.length, gap: 2 });
    const { draggingIndex, dropIndex, getHandleProps, canReorder } = useToolbarReorder({
      count: groups.length,
      movable,
      allowCrossRow: true,
      itemRefs,
      onReorder: (from, to) =>
        setOrder((prev) => {
          const next = [...prev];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return next;
        }),
    });

    return (
      <div style={{ width: 190 }}>
        <ToolbarBand
          ref={stripRef}
          rows={rows.map((row) => (
            <ToolbarRow key={row[0]} data-testid="cross-row">
              {row.map((position) => (
                <Toolbar
                  key={position}
                  variant="band"
                  items={groups[order[position]]}
                  grip={movable[position]}
                  gripProps={canReorder(position) ? getHandleProps(position) : undefined}
                  ref={(element: HTMLDivElement | null) => {
                    itemRefs.current[position] = element;
                  }}
                  data-testid={`cross-group-${order[position]}`}
                  data-drop={dropIndex === position && draggingIndex !== position ? '' : undefined}
                  style={{
                    opacity: draggingIndex === position ? 0.5 : undefined,
                    boxShadow:
                      dropIndex === position && draggingIndex !== position
                        ? 'inset 2px 0 0 #000080'
                        : undefined,
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
