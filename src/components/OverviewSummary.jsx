import PropTypes from 'prop-types';

const formatCount = (value) => new Intl.NumberFormat('fr-FR').format(Number(value) || 0);

const OverviewSummary = ({ overview, performance, totals, sheet, onNavigate }) => {
  const stageSummaries = Array.isArray(performance?.categories) ? performance.categories : [];
  const opportunityList = Array.isArray(totals?.list) ? totals.list.slice(0, 4) : [];
  const sheetSample = Array.isArray(sheet?.sample) ? sheet.sample : [];
  const stageDistribution = Array.isArray(sheet?.stageDistribution) ? sheet.stageDistribution : [];

  const handleNavigate = (pageId) => {
    if (typeof onNavigate === 'function') {
      onNavigate(pageId);
    }
  };

  return (
    <div className="overview-page">
      <section className="card overview-page__intro" aria-labelledby="overview-intro-title">
        <header className="overview-page__intro-header">
          <div>
            <p className="card__eyebrow">Vue d’ensemble du pipeline SEO</p>
            <h2 id="overview-intro-title">{overview.title}</h2>
            <p className="card__subtitle">{overview.subtitle}</p>
          </div>
          <div className="overview-page__cta-group" role="group" aria-label="Accès rapide aux sections détaillées">
            <button type="button" className="pill-button" onClick={() => handleNavigate('funnel')}>
              Explorer le tunnel
            </button>
            <button type="button" className="pill-button" onClick={() => handleNavigate('seo')}>
              Voir les opportunités
            </button>
            <button type="button" className="pill-button" onClick={() => handleNavigate('sheet')}>
              Ouvrir le tableur
            </button>
          </div>
        </header>

        <div className="overview-page__stats">
          <div className="overview-page__stat">
            <p className="overview-page__stat-label">{overview.quantity.label}</p>
            <p className="overview-page__stat-value">{overview.quantity.value}</p>
          </div>
          <div className="overview-page__stat">
            <p className="overview-page__stat-label">{overview.summary.label}</p>
            <p className="overview-page__stat-value">{overview.summary.value}</p>
            <p className={`trend trend--${overview.summary.trend.direction}`}>{overview.summary.trend.text}</p>
          </div>
          {overview.rows.slice(0, 4).map((row) => (
            <div key={row.label} className="overview-page__stat overview-page__stat--compact">
              <p className="overview-page__stat-label">{row.label}</p>
              <p className="overview-page__stat-value">{row.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="overview-page__grid" aria-label="Synthèse des autres vues">
        <article className="card overview-page__panel" aria-labelledby="overview-pipeline-title">
          <header className="overview-page__panel-header">
            <div>
              <h3 id="overview-pipeline-title">Pipeline et entonnoir</h3>
              <p className="card__subtitle">
                {performance.centerValue} · {performance.datasets?.[0]?.total}
              </p>
            </div>
            <button type="button" className="text-button" onClick={() => handleNavigate('funnel')}>
              Accéder au détail
            </button>
          </header>
          <p className="overview-page__panel-text">
            Les mots-clés suivis couvrent l’ensemble du parcours : de la sensibilisation à la décision.
            Utilisez le volet « Funnel Stages » pour visualiser les contenus et sujets par étape.
          </p>
          <ul className="overview-page__list">
            {stageSummaries.map((stage) => (
              <li key={stage.key} className="overview-page__list-item">
                <span className="overview-page__list-label">{stage.label}</span>
                <span className="overview-page__list-value">{stage.amount}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card overview-page__panel" aria-labelledby="overview-opportunity-title">
          <header className="overview-page__panel-header">
            <div>
              <h3 id="overview-opportunity-title">Opportunités SEO à prioriser</h3>
              <p className="card__subtitle">{totals.highlight?.value} · {totals.highlight?.trend?.text}</p>
            </div>
            <button type="button" className="text-button" onClick={() => handleNavigate('seo')}>
              Voir la cartographie
            </button>
          </header>
          <p className="overview-page__panel-text">
            Retrouvez dans « SEO Opportunity » les sujets à fort impact classés par cluster. Les meilleures
            pistes sont listées ci-dessous pour démarrer rapidement vos optimisations.
          </p>
          <ul className="overview-page__list">
            {opportunityList.map((item) => (
              <li key={item.label} className="overview-page__list-item">
                <span className="overview-page__list-label">{item.label}</span>
                <span className="overview-page__list-value">
                  {item.value} · {item.trend?.text}
                </span>
              </li>
            ))}
          </ul>
          {totals.footer && (
            <footer className="overview-page__panel-footer">
              <p className="overview-page__panel-footer-label">{totals.footer.label}</p>
              <p className={`trend trend--${totals.footer.trend?.direction || 'neutral'}`}>
                {totals.footer.value} · {totals.footer.trend?.text}
              </p>
            </footer>
          )}
        </article>
      </section>

      <section className="card overview-page__panel overview-page__sheet" aria-labelledby="overview-sheet-title">
        <header className="overview-page__panel-header">
          <div>
            <h3 id="overview-sheet-title">Ce que révèle le tableur projet</h3>
            <p className="card__subtitle">
              {formatCount(sheet.totalKeywords)} mots-clés suivis · {formatCount(sheet.uniqueClusters)} clusters actifs
            </p>
          </div>
          <button type="button" className="text-button" onClick={() => handleNavigate('sheet')}>
            Consulter toutes les lignes
          </button>
        </header>
        <p className="overview-page__panel-text">
          Le tableur consolide les données opérationnelles utilisées dans les vues précédentes. Voici la
          répartition actuelle des sujets et quelques exemples de priorités identifiées.
        </p>
        <div className="overview-page__sheet-grid">
          <div>
            <h4 className="overview-page__section-title">Répartition par étape</h4>
            <ul className="overview-page__list">
              {stageDistribution.map((stage) => (
                <li key={stage.label} className="overview-page__list-item">
                  <span className="overview-page__list-label">{stage.label}</span>
                  <span className="overview-page__list-value">
                    {formatCount(stage.count)} mots-clés · {stage.share}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="overview-page__section-title">Exemples à forte priorité</h4>
            <ul className="overview-page__keyword-list">
              {sheetSample.length === 0 && (
                <li className="overview-page__keyword-empty">Aucune ligne enregistrée pour le moment.</li>
              )}
              {sheetSample.map((keyword) => (
                <li key={keyword.primaryKeyword} className="overview-page__keyword-item">
                  <span className="overview-page__keyword-term">{keyword.primaryKeyword}</span>
                  <span className="overview-page__keyword-meta">
                    {keyword.cluster} · {keyword.funnelStage} · {keyword.volume} recherches
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

OverviewSummary.propTypes = {
  overview: PropTypes.shape({
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    quantity: PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }).isRequired,
    rows: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      })
    ).isRequired,
    summary: PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      trend: PropTypes.shape({
        direction: PropTypes.oneOf(['positive', 'negative', 'neutral']).isRequired,
        text: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
  performance: PropTypes.shape({
    centerValue: PropTypes.string,
    categories: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        amount: PropTypes.string.isRequired,
      })
    ),
    datasets: PropTypes.arrayOf(
      PropTypes.shape({
        total: PropTypes.string,
      })
    ),
  }).isRequired,
  totals: PropTypes.shape({
    highlight: PropTypes.shape({
      value: PropTypes.string,
      trend: PropTypes.shape({
        text: PropTypes.string,
        direction: PropTypes.oneOf(['positive', 'negative', 'neutral']),
      }),
    }),
    list: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
        trend: PropTypes.shape({
          text: PropTypes.string,
        }),
      })
    ),
    footer: PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
      trend: PropTypes.shape({
        direction: PropTypes.oneOf(['positive', 'negative', 'neutral']),
        text: PropTypes.string,
      }),
    }),
  }).isRequired,
  sheet: PropTypes.shape({
    totalKeywords: PropTypes.number.isRequired,
    uniqueClusters: PropTypes.number.isRequired,
    stageDistribution: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        count: PropTypes.number.isRequired,
        share: PropTypes.string.isRequired,
      })
    ).isRequired,
    sample: PropTypes.arrayOf(
      PropTypes.shape({
        primaryKeyword: PropTypes.string.isRequired,
        cluster: PropTypes.string.isRequired,
        funnelStage: PropTypes.string.isRequired,
        volume: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      })
    ).isRequired,
  }).isRequired,
  onNavigate: PropTypes.func,
};

OverviewSummary.defaultProps = {
  onNavigate: undefined,
};

export default OverviewSummary;
