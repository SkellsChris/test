import { useMemo, useState } from 'react';
import TimeFilter from './components/TimeFilter.jsx';
import OverviewCard from './components/OverviewCard.jsx';
import PerformancePanel from './components/PerformancePanel.jsx';
import TotalsPanel from './components/TotalsPanel.jsx';
import SheetModal from './components/SheetModal.jsx';
import FunnelStages from './components/FunnelStages.jsx';
import SeoOpportunity from './components/SeoOpportunity.jsx';
import { KEYWORD_SHEET_ROWS } from './data/keywordSheet.js';
import { DASHBOARD_DATA, TIMEFRAME_OPTIONS } from './data/dashboardData.js';

const App = () => {
  const [activeTimeframe, setActiveTimeframe] = useState('TY');
  const [activePage, setActivePage] = useState('overview');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeProject, setActiveProject] = useState('atlas-redesign');

  const projectOptions = [
    { id: 'atlas-redesign', label: 'Atlas Redesign' },
    { id: 'aurora-insights', label: 'Aurora Insights' },
    { id: 'nova-growth', label: 'Nova Growth' },
  ];

  const activeData = DASHBOARD_DATA[activeTimeframe];

  const activeTimeframeLabel = useMemo(() => {
    const option = TIMEFRAME_OPTIONS.find((item) => item.id === activeTimeframe);
    return option ? option.name : '';
  }, [activeTimeframe]);

  const pageMetadata = useMemo(
    () => ({
      overview: {
        title: 'General statistics',
        subtitle: `Total system load${activeTimeframeLabel ? ` · ${activeTimeframeLabel}` : ''}`,
      },
      funnel: {
        title: 'Funnel Stages',
        subtitle: 'Visualise how prospects move through your revenue funnel.',
      },
      seo: {
        title: 'SEO Opportunity',
        subtitle: 'Map high-potential keywords to focus your optimisation efforts.',
      },
    }),
    [activeTimeframeLabel]
  );

  const pages = [
    { id: 'overview', label: 'Overview' },
    { id: 'funnel', label: 'Funnel Stages' },
    { id: 'seo', label: 'SEO Opportunity' },
  ];

  const renderPage = () => {
    if (activePage === 'funnel') {
      return (
        <main className="funnel-layout">
          <FunnelStages
            timeframeOptions={TIMEFRAME_OPTIONS}
            activeTimeframe={activeTimeframe}
            onTimeframeChange={setActiveTimeframe}
          />
        </main>
      );
    }

    if (activePage === 'seo') {
      return (
        <main className="funnel-layout">
          <SeoOpportunity />
        </main>
      );
    }

    return (
      <main className="dashboard-grid">
        <OverviewCard data={activeData.overview} />
        <PerformancePanel data={activeData.performance} />
        <TotalsPanel data={activeData.totals} />
      </main>
    );
  };

  return (
    <div className="app">
      <div className="background-blob background-blob--one" aria-hidden="true" />
      <div className="background-blob background-blob--two" aria-hidden="true" />
      <div className="app-shell">
        <header className="page-header">
          <div className="page-header__content">
            <h1>{pageMetadata[activePage].title}</h1>
            <p>{pageMetadata[activePage].subtitle}</p>
            <nav className="page-nav" aria-label="Dashboard sections">
              {pages.map((page) => {
                const isActive = page.id === activePage;
                return (
                  <button
                    key={page.id}
                    type="button"
                    className={`page-nav__button${isActive ? ' page-nav__button--active' : ''}`}
                    aria-pressed={isActive}
                    onClick={() => setActivePage(page.id)}
                  >
                    {page.label}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="page-header__actions">
            <div className="project-switcher">
              <label className="project-switcher__label" htmlFor="project-selector">
                Projet
              </label>
              <select
                id="project-selector"
                className="project-switcher__select"
                value={activeProject}
                onChange={(event) => setActiveProject(event.target.value)}
              >
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.label}
                  </option>
                ))}
              </select>
              <button type="button" className="project-switcher__button">
                Nouveau projet
              </button>
            </div>
            {activePage === 'overview' ? (
              <>
                <button type="button" className="sheet-trigger" onClick={() => setIsSheetOpen(true)}>
                  Sheet
                </button>
                {TIMEFRAME_OPTIONS.length > 1 ? (
                  <TimeFilter
                    options={TIMEFRAME_OPTIONS}
                    activeId={activeTimeframe}
                    onSelect={setActiveTimeframe}
                  />
                ) : null}
              </>
            ) : null}
          </div>
        </header>

        {renderPage()}
      </div>
      <SheetModal open={isSheetOpen} onClose={() => setIsSheetOpen(false)} rows={KEYWORD_SHEET_ROWS} />
    </div>
  );
};

export default App;
