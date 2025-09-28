import { useCallback, useEffect, useMemo, useState } from 'react';
import TimeFilter from './components/TimeFilter.jsx';
import OverviewCard from './components/OverviewCard.jsx';
import PerformancePanel from './components/PerformancePanel.jsx';
import TotalsPanel from './components/TotalsPanel.jsx';
import SheetModal from './components/SheetModal.jsx';
import FunnelStages from './components/FunnelStages.jsx';
import SeoOpportunity from './components/SeoOpportunity.jsx';
import SheetView from './components/SheetView.jsx';
import LogoutButton from './components/LogoutButton.jsx';
import { KEYWORD_SHEET_ROWS } from './data/keywordSheet.js';
import { DASHBOARD_DATA, TIMEFRAME_OPTIONS } from './data/dashboardData.js';
import NewProjectModal from './components/NewProjectModal.jsx';
import { createProject, deleteProject, fetchProjects } from './services/projects.js';
import { isSupabaseConfigured } from './services/supabaseClient.js';
import { useAuth } from './auth/AuthProvider.jsx';

const DEFAULT_PROJECTS = [
  { id: 'atlas-redesign', label: 'Atlas Redesign', description: '' },
  { id: 'aurora-insights', label: 'Aurora Insights', description: '' },
  { id: 'nova-growth', label: 'Nova Growth', description: '' },
];

const normaliseProject = (project) => ({
  id: project.id,
  label: project.name || project.label || 'Projet sans nom',
  description: project.description || '',
  created_at: project.created_at || new Date().toISOString(),
});

const mergeProjects = (incoming, existing) => {
  const seen = new Set();
  const merged = [];

  incoming.forEach((project) => {
    if (project && project.id && !seen.has(project.id)) {
      seen.add(project.id);
      merged.push(project);
    }
  });

  existing.forEach((project) => {
    if (project && project.id && !seen.has(project.id)) {
      seen.add(project.id);
      merged.push(project);
    }
  });

  return merged;
};

const STORAGE_KEY = 'atlas-dashboard.project-sheets';

const cloneRows = (rows) => (Array.isArray(rows) ? rows.map((row) => ({ ...row })) : []);

const loadStoredSheets = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return Object.entries(parsed).reduce((accumulator, [projectId, rows]) => {
      accumulator[projectId] = cloneRows(rows);
      return accumulator;
    }, {});
  } catch (error) {
    console.error('Failed to read stored project sheets', error);
    return null;
  }
};

const createInitialSheetsState = () => {
  const stored = loadStoredSheets();
  if (stored) {
    if (!stored['atlas-redesign'] || stored['atlas-redesign'].length === 0) {
      stored['atlas-redesign'] = KEYWORD_SHEET_ROWS.map((row) => ({ ...row }));
    }
    return stored;
  }

  return {
    'atlas-redesign': KEYWORD_SHEET_ROWS.map((row) => ({ ...row })),
  };
};

const App = () => {
  const { user } = useAuth();
  const [activeTimeframe, setActiveTimeframe] = useState('TY');
  const [activePage, setActivePage] = useState('overview');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeProject, setActiveProject] = useState('atlas-redesign');
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [projectSheets, setProjectSheets] = useState(createInitialSheetsState);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isProjectDeleting, setIsProjectDeleting] = useState(false);

  const activeData = DASHBOARD_DATA[activeTimeframe];

  const pageMetadata = useMemo(
    () => ({
      overview: {
        title: 'General statistics',
        subtitle: 'Total system load',
      },
      funnel: {
        title: 'Funnel Stages',
        subtitle: 'Visualise how prospects move through your revenue funnel.',
      },
      seo: {
        title: 'SEO Opportunity',
        subtitle: 'Map high-potential keywords to focus your optimisation efforts.',
      },
      sheet: {
        title: 'Sheet',
        subtitle: 'Browse the saved keyword rows for the active project.',
      },
    }),
    []
  );

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => {
      clearTimeout(timeout);
    };
  }, [toast]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined;
    }

    let isMounted = true;
    setIsProjectLoading(true);

    fetchProjects()
      .then((remoteProjects) => {
        if (!isMounted || !remoteProjects || remoteProjects.length === 0) {
          return;
        }

        const normalised = remoteProjects.map(normaliseProject);
        setProjects((previous) => mergeProjects(normalised, previous));
        setActiveProject((current) => {
          if (current && normalised.some((project) => project.id === current)) {
            return current;
          }
          return normalised[0]?.id || current;
        });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        setToast({ type: 'error', message: error?.message || 'Impossible de charger les projets.' });
      })
      .finally(() => {
        if (isMounted) {
          setIsProjectLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (projects.length === 0) {
      return;
    }

    const exists = projects.some((project) => project.id === activeProject);
    if (!exists) {
      setActiveProject(projects[0].id);
    }
  }, [projects, activeProject]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const serialisable = Object.entries(projectSheets).reduce((accumulator, [projectId, rows]) => {
        accumulator[projectId] = cloneRows(rows);
        return accumulator;
      }, {});

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialisable));
    } catch (error) {
      console.error('Failed to persist project sheets', error);
    }
  }, [projectSheets]);

  useEffect(() => {
    setProjectSheets((previous) => {
      const next = { ...previous };
      let hasChanged = false;

      projects.forEach((project) => {
        if (project?.id && !next[project.id]) {
          next[project.id] = [];
          hasChanged = true;
        }
      });

      return hasChanged ? next : previous;
    });
  }, [projects]);

  const handleProjectCreate = async ({ name, description }) => {
    if (!user) {
      const message = 'Veuillez vous connecter pour créer un projet.';
      setToast({ type: 'error', message });
      throw new Error(message);
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const optimisticProject = normaliseProject({
      id: `temp-${Date.now()}`,
      name: trimmedName,
      description: trimmedDescription,
      created_at: new Date().toISOString(),
    });

    const previousActiveProject = activeProject;

    setProjects((previous) => [optimisticProject, ...previous.filter((project) => project.id !== optimisticProject.id)]);
    setActiveProject(optimisticProject.id);

    try {
      const created = await createProject({
        name: trimmedName,
        description: trimmedDescription,
        owner: user?.id || null,
      });
      const normalised = normaliseProject(created);

      setProjects((previous) => {
        const withoutOptimistic = previous.filter((project) => project.id !== optimisticProject.id);
        const withoutDuplicate = withoutOptimistic.filter((project) => project.id !== normalised.id);
        return [normalised, ...withoutDuplicate];
      });

      setActiveProject(normalised.id);
      setToast({ type: 'success', message: 'Projet créé avec succès.' });

      setProjectSheets((previous) => ({
        ...previous,
        [normalised.id]: [],
      }));

      return normalised;
    } catch (error) {
      setProjects((previous) => previous.filter((project) => project.id !== optimisticProject.id));
      setActiveProject(previousActiveProject);

      const message = error?.message || 'Impossible de créer le projet.';
      setToast({ type: 'error', message });

      throw new Error(message);
    }
  };

  const handleProjectDelete = async () => {
    if (!activeProject || isProjectDeleting) {
      return;
    }

    if (!user) {
      setToast({ type: 'error', message: 'Veuillez vous connecter pour supprimer un projet.' });
      return;
    }

    const projectToDelete = projects.find((project) => project.id === activeProject);
    if (!projectToDelete) {
      return;
    }

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        `Voulez-vous vraiment supprimer le projet « ${projectToDelete.label} » ? Cette action est irréversible.`
      );
      if (!confirmed) {
        return;
      }
    }

    setIsProjectDeleting(true);

    const previousProjects = projects;
    const previousProjectSheets = projectSheets;
    const previousActiveProject = activeProject;

    const nextProjects = projects.filter((project) => project.id !== projectToDelete.id);

    setProjects(nextProjects);
    setActiveProject((current) => (current === projectToDelete.id ? nextProjects[0]?.id || '' : current));
    setProjectSheets((previous) => {
      const next = { ...previous };
      delete next[projectToDelete.id];
      return next;
    });

    try {
      await deleteProject(projectToDelete.id);
      setToast({ type: 'success', message: 'Projet supprimé avec succès.' });
    } catch (error) {
      setProjects(previousProjects);
      setActiveProject(previousActiveProject);
      setProjectSheets(previousProjectSheets);
      setToast({ type: 'error', message: error?.message || 'Impossible de supprimer le projet.' });
    } finally {
      setIsProjectDeleting(false);
    }
  };

  const pages = [
    { id: 'overview', label: 'Overview' },
    { id: 'funnel', label: 'Funnel Stages' },
    { id: 'seo', label: 'SEO Opportunity' },
    { id: 'sheet', label: 'Sheet' },
  ];

  const activeProjectRows = projectSheets[activeProject] || [];

  const handleSheetRowsChange = useCallback(
    (nextRows) => {
      setProjectSheets((previous) => ({
        ...previous,
        [activeProject]: Array.isArray(nextRows) ? nextRows.map((row) => ({ ...row })) : [],
      }));
    },
    [activeProject]
  );

  const renderPage = () => {
    if (activePage === 'funnel') {
      return (
        <main className="funnel-layout">
          <FunnelStages
            rows={activeProjectRows}
          />
        </main>
      );
    }

    if (activePage === 'seo') {
      return (
        <main className="funnel-layout">
          <SeoOpportunity rows={activeProjectRows} />
        </main>
      );
    }

    if (activePage === 'sheet') {
      return (
        <main className="funnel-layout">
          <SheetView rows={activeProjectRows} />
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
                disabled={isProjectLoading || projects.length === 0}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.label}
                  </option>
                ))}
              </select>
              <div className="project-switcher__actions">
                <button
                  type="button"
                  className="project-switcher__button"
                  onClick={() => setIsNewProjectOpen(true)}
                  disabled={isProjectLoading || !user}
                >
                  Nouveau projet
                </button>
                <button
                  type="button"
                  className="project-switcher__button project-switcher__button--danger"
                  onClick={handleProjectDelete}
                  disabled={
                    isProjectLoading ||
                    isProjectDeleting ||
                    projects.length === 0 ||
                    !activeProject
                  }
                >
                  Supprimer le projet
                </button>
                {!user ? <span className="project-switcher__hint">Veuillez vous connecter</span> : null}
              </div>
            </div>
            {activePage === 'overview' || activePage === 'sheet' || activePage === 'seo' ? (
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
            <LogoutButton className="page-header__logout" />
          </div>
        </header>

        {renderPage()}
      </div>
      <SheetModal
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        rows={activeProjectRows}
        onRowsChange={handleSheetRowsChange}
        projectId={activeProject}
      />
      <NewProjectModal
        open={isNewProjectOpen}
        onRequestClose={() => setIsNewProjectOpen(false)}
        onSubmit={handleProjectCreate}
      />
      {toast ? (
        <div className={`app-toast app-toast--${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Fermer la notification">
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default App;
