import {
  ModusWcIcon,
  ModusWcMenu,
  ModusWcMenuItem,
  ModusWcNavbar,
  ModusWcSideNavigation,
} from '@trimble-oss/moduswebcomponents-react';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

const NAV_ITEMS = [
  { path: '/customers', label: 'Customers', icon: 'person' },
  { path: '/jobs', label: 'Jobs', icon: 'briefcase' },
];

const NAV_EXPANDED_WIDTH = '256px';
// The width Modus gives the side navigation when collapsed to icons.
const NAV_COLLAPSED_WIDTH = '4rem';

/** The Modus navbar and side navigation around every page. */
export function AppShell() {
  const [navExpanded, setNavExpanded] = useState(true);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <ModusWcNavbar
        mainMenuOpen={navExpanded}
        visibility={{ mainMenu: true, user: false }}
        onMainMenuOpenChange={(e) => setNavExpanded(e.detail)}
      >
        <span slot="start" className="app-title">
          Jarvis CRM
        </span>
      </ModusWcNavbar>
      <div className="app-shell-body">
        <ModusWcSideNavigation
          className="app-shell-nav"
          expanded={navExpanded}
          collapseOnClickOutside={false}
          maxWidth={NAV_EXPANDED_WIDTH}
          onExpandedChange={(e) => setNavExpanded(e.detail)}
        >
          <ModusWcMenu size="lg" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <ModusWcMenuItem
                key={item.path}
                label={item.label}
                value={item.path}
                selected={pathname.startsWith(item.path)}
                tooltipContent={navExpanded ? undefined : item.label}
                onItemSelect={() => navigate(item.path)}
              >
                <ModusWcIcon slot="start-icon" name={item.icon} version="2.0" decorative />
              </ModusWcMenuItem>
            ))}
          </ModusWcMenu>
        </ModusWcSideNavigation>
        {/* The side navigation floats over the page, so the content is offset by its current width. */}
        <main
          className="app-shell-main"
          style={{ marginLeft: navExpanded ? NAV_EXPANDED_WIDTH : NAV_COLLAPSED_WIDTH }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
