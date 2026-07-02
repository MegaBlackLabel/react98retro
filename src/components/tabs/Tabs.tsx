import {
  forwardRef,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
};

export type TabsProps = {
  tabs: TabItem[];
  activeTab?: string;
  defaultActiveTab?: string;
  onTabChange?: (id: string) => void;
  multirows?: boolean;
} & ComponentPropsWithoutRef<'div'>;

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      tabs,
      activeTab,
      defaultActiveTab,
      onTabChange,
      multirows = false,
      className,
      ...props
    },
    ref,
  ) => {
    const firstEnabledTabId = useMemo(
      () => tabs.find((tab) => !tab.disabled)?.id ?? tabs[0]?.id,
      [tabs],
    );
    const [internalActiveTab, setInternalActiveTab] = useState(
      defaultActiveTab ?? firstEnabledTabId,
    );

    const isControlled = activeTab != null;
    const currentTabId = activeTab ?? internalActiveTab;
    const activeTabId = currentTabId ?? firstEnabledTabId;
    const activeTabItem = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

    const handleTabClick = (id: string, disabled?: boolean) => {
      if (disabled) {
        return;
      }

      if (!isControlled) {
        setInternalActiveTab(id);
      }

      onTabChange?.(id);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      const enabledTabs = tabs.filter((t) => !t.disabled);
      if (enabledTabs.length === 0) return;

      const currentIdx = enabledTabs.findIndex((t) => t.id === activeTabId);
      const actualIdx = currentIdx === -1 ? 0 : currentIdx;

      let nextIdx: number | null = null;

      switch (e.key) {
        case 'ArrowRight':
          nextIdx = (actualIdx + 1) % enabledTabs.length;
          break;
        case 'ArrowLeft':
          nextIdx = (actualIdx - 1 + enabledTabs.length) % enabledTabs.length;
          break;
        case 'Home':
          nextIdx = 0;
          break;
        case 'End':
          nextIdx = enabledTabs.length - 1;
          break;
        default:
          break;
          return;
      }

      if (nextIdx !== null) {
        e.preventDefault();
        const nextTab = enabledTabs[nextIdx];
        handleTabClick(nextTab.id);
      }
    };

    return (
      <div ref={ref} className={className} {...props}>
        <menu role="tablist" className={clsx({ multirows })} onKeyDown={handleKeyDown}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;

            return (
              <li
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-disabled={tab.disabled || undefined}
              >
                <a
                  href={`#${tab.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    handleTabClick(tab.id, tab.disabled);
                  }}
                >
                  {tab.label}
                </a>
              </li>
            );
          })}
        </menu>
        <div className="window" role="tabpanel">
          <div className="window-body">{activeTabItem?.content}</div>
        </div>
      </div>
    );
  },
);

Tabs.displayName = 'Tabs';
