import { useMemo, useState } from 'react';
import TimeFilter from './components/TimeFilter.jsx';
import OverviewCard from './components/OverviewCard.jsx';
import PerformancePanel from './components/PerformancePanel.jsx';
import TotalsPanel from './components/TotalsPanel.jsx';
import { DASHBOARD_DATA, TIMEFRAME_OPTIONS } from './data/dashboardData.js';

const App = () => {
  const [activeTimeframe, setActiveTimeframe] = useState('TY');

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
          <TimeFilter
            options={TIMEFRAME_OPTIONS}
            activeId={activeTimeframe}
            onSelect={setActiveTimeframe}
          />
        </header>

        <main className="dashboard-grid">
          <OverviewCard data={activeData.overview} />
          <PerformancePanel data={activeData.performance} />
          <TotalsPanel data={activeData.totals} />
        </main>
      </div>
    </div>
  );
};

export default App;
