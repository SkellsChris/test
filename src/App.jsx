import { useMemo, useState } from 'react';
import TimeFilter from './components/TimeFilter.jsx';
import OverviewCard from './components/OverviewCard.jsx';
import PerformancePanel from './components/PerformancePanel.jsx';
import TotalsPanel from './components/TotalsPanel.jsx';
import SheetModal from './components/SheetModal.jsx';
import { KEYWORD_SHEET_ROWS } from './data/keywordSheet.js';
import { DASHBOARD_DATA, TIMEFRAME_OPTIONS } from './data/dashboardData.js';

const App = () => {
  const [activeTimeframe, setActiveTimeframe] = useState('TY');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const activeData = DASHBOARD_DATA[activeTimeframe];

  const activeTimeframeLabel = useMemo(() => {
    const option = TIMEFRAME_OPTIONS.find((item) => item.id === activeTimeframe);
    return option ? option.name : '';
  }, [activeTimeframe]);

  return (
    <div className="app">
      <div className="background-blob background-blob--one" aria-hidden="true" />
      <div className="background-blob background-blob--two" aria-hidden="true" />
      <div className="app-shell">
        <header className="page-header">
          <div>
            <h1>General statistics</h1>
            <p>{`Total system load${activeTimeframeLabel ? ` · ${activeTimeframeLabel}` : ''}`}</p>
          </div>
          <div className="page-header__actions">
            <button type="button" className="sheet-trigger" onClick={() => setIsSheetOpen(true)}>
              Sheet
            </button>
            <TimeFilter
              options={TIMEFRAME_OPTIONS}
              activeId={activeTimeframe}
              onSelect={setActiveTimeframe}
            />
          </div>
        </header>

        <main className="dashboard-grid">
          <OverviewCard data={activeData.overview} />
          <PerformancePanel data={activeData.performance} />
          <TotalsPanel data={activeData.totals} />
        </main>
      </div>
      <SheetModal open={isSheetOpen} onClose={() => setIsSheetOpen(false)} rows={KEYWORD_SHEET_ROWS} />
    </div>
  );
};

export default App;
