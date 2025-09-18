const BASE_OVERVIEW = {
  title: 'Total system load',
  subtitle: 'All figures are normal',
  quantity: { label: 'Quantity of data' },
};

const BASE_PERFORMANCE = {
  eyebrow: 'All figures are normal',
  title: 'System performance',
  centerLabel: 'Total earning',
};

const BASE_TOTALS = {
  title: 'Total earning',
};

export const TIMEFRAME_OPTIONS = [{ id: 'TY', label: 'Sheet', name: 'Sheet' }];

export const DASHBOARD_DATA = {
  TM: {
    overview: {
      ...BASE_OVERVIEW,
      quantity: { ...BASE_OVERVIEW.quantity, value: '12,540' },
      rows: [
        { label: 'Server', value: '214' },
        { label: 'Clients', value: '864' },
        { label: 'Payments', value: '612' },
        { label: 'Responses', value: '435' },
        { label: 'Users', value: '1,284' },
        { label: 'Errors', value: '42' },
      ],
      summary: {
        label: 'Total earning',
        value: '$3,420',
        trend: { direction: 'positive', text: '+2.3%' },
      },
    },
    performance: {
      ...BASE_PERFORMANCE,
      centerValue: '$8,214',
      categories: [
        { key: 'design', label: 'Design', amount: '$2,104' },
        { key: 'startup', label: 'Startup', amount: '$4,812' },
        { key: 'business', label: 'Business', amount: '$8,214' },
        { key: 'investment', label: 'Investment', amount: '$15,420' },
        { key: 'product', label: 'Product', amount: '$3,624' },
        { key: 'development', label: 'Development', amount: '$2,910' },
      ],
      datasets: [
        {
          id: 'business',
          label: 'Business',
          total: '12,420',
          className: 'primary',
          values: {
            design: 45,
            startup: 60,
            business: 78,
            investment: 52,
            product: 58,
            development: 48,
          },
        },
        {
          id: 'investment',
          label: 'Investment',
          total: '22,874',
          className: 'secondary',
          values: {
            design: 38,
            startup: 54,
            business: 63,
            investment: 88,
            product: 66,
            development: 52,
          },
        },
      ],
    },
    totals: {
      ...BASE_TOTALS,
      eyebrow: 'Last week',
      highlight: {
        value: '$4,218',
        trend: { direction: 'positive', text: '+3.1%' },
      },
      list: [
        { label: 'Travel', value: '1,824', trend: { direction: 'positive', text: '+1.8%' } },
        { label: 'Medical', value: '982', trend: { direction: 'positive', text: '+0.9%' } },
        { label: 'Financial', value: '1,204', trend: { direction: 'neutral', text: '0.0%' } },
        { label: 'E-commerce', value: '2,118', trend: { direction: 'positive', text: '+1.4%' } },
        { label: 'Insurance', value: '1,042', trend: { direction: 'negative', text: '-0.8%' } },
        { label: 'Marketing', value: '1,386', trend: { direction: 'positive', text: '+0.6%' } },
      ],
      footer: {
        label: 'Total earning',
        value: '$6,742',
        trend: { direction: 'positive', text: 'Compared to last week 2.1%' },
      },
    },
  },
  TR: {
    overview: {
      ...BASE_OVERVIEW,
      quantity: { ...BASE_OVERVIEW.quantity, value: '38,914' },
      rows: [
        { label: 'Server', value: '642' },
        { label: 'Clients', value: '2,310' },
        { label: 'Payments', value: '1,842' },
        { label: 'Responses', value: '1,328' },
        { label: 'Users', value: '3,972' },
        { label: 'Errors', value: '168' },
      ],
      summary: {
        label: 'Total earning',
        value: '$9,860',
        trend: { direction: 'positive', text: '+3.8%' },
      },
    },
    performance: {
      ...BASE_PERFORMANCE,
      centerValue: '$18,964',
      categories: [
        { key: 'design', label: 'Design', amount: '$4,206' },
        { key: 'startup', label: 'Startup', amount: '$12,318' },
        { key: 'business', label: 'Business', amount: '$28,942' },
        { key: 'investment', label: 'Investment', amount: '$64,228' },
        { key: 'product', label: 'Product', amount: '$9,614' },
        { key: 'development', label: 'Development', amount: '$6,482' },
      ],
      datasets: [
        {
          id: 'business',
          label: 'Business',
          total: '36,824',
          className: 'primary',
          values: {
            design: 55,
            startup: 72,
            business: 84,
            investment: 62,
            product: 70,
            development: 60,
          },
        },
        {
          id: 'investment',
          label: 'Investment',
          total: '92,416',
          className: 'secondary',
          values: {
            design: 48,
            startup: 66,
            business: 74,
            investment: 94,
            product: 82,
            development: 68,
          },
        },
      ],
    },
    totals: {
      ...BASE_TOTALS,
      eyebrow: 'Last quarter',
      highlight: {
        value: '$9,412',
        trend: { direction: 'positive', text: '+6.4%' },
      },
      list: [
        { label: 'Travel', value: '3,642', trend: { direction: 'positive', text: '+2.2%' } },
        { label: 'Medical', value: '1,926', trend: { direction: 'positive', text: '+1.4%' } },
        { label: 'Financial', value: '4,318', trend: { direction: 'neutral', text: '+0.1%' } },
        { label: 'E-commerce', value: '5,824', trend: { direction: 'positive', text: '+2.9%' } },
        { label: 'Insurance', value: '3,210', trend: { direction: 'negative', text: '-1.2%' } },
        { label: 'Marketing', value: '3,874', trend: { direction: 'positive', text: '+0.9%' } },
      ],
      footer: {
        label: 'Total earning',
        value: '$14,208',
        trend: { direction: 'positive', text: 'Compared to last quarter 3.9%' },
      },
    },
  },
  TY: {
    overview: {
      ...BASE_OVERVIEW,
      quantity: { ...BASE_OVERVIEW.quantity, value: '98,642' },
      rows: [
        { label: 'Server', value: '1,536' },
        { label: 'Clients', value: '6,420' },
        { label: 'Payments', value: '3,624' },
        { label: 'Responses', value: '2,435' },
        { label: 'Users', value: '8,419' },
        { label: 'Errors', value: '512' },
      ],
      summary: {
        label: 'Total earning',
        value: '$18,745',
        trend: { direction: 'positive', text: '+4.6%' },
      },
    },
    performance: {
      ...BASE_PERFORMANCE,
      centerValue: '$30,113',
      categories: [
        { key: 'design', label: 'Design', amount: '$10,402' },
        { key: 'startup', label: 'Startup', amount: '$30,113' },
        { key: 'business', label: 'Business', amount: '$79,464' },
        { key: 'investment', label: 'Investment', amount: '$249,542' },
        { key: 'product', label: 'Product', amount: '$33,501' },
        { key: 'development', label: 'Development', amount: '$18,440' },
      ],
      datasets: [
        {
          id: 'business',
          label: 'Business',
          total: '79,464',
          className: 'primary',
          values: {
            design: 62,
            startup: 74,
            business: 88,
            investment: 65,
            product: 70,
            development: 58,
          },
        },
        {
          id: 'investment',
          label: 'Investment',
          total: '249,542',
          className: 'secondary',
          values: {
            design: 55,
            startup: 68,
            business: 76,
            investment: 98,
            product: 82,
            development: 66,
          },
        },
      ],
    },
    totals: {
      ...BASE_TOTALS,
      eyebrow: 'Last month',
      highlight: {
        value: '$12,875',
        trend: { direction: 'positive', text: '+8.3%' },
      },
      list: [
        { label: 'Travel', value: '7,364', trend: { direction: 'positive', text: '+2.6%' } },
        { label: 'Medical', value: '2,524', trend: { direction: 'positive', text: '+1.2%' } },
        { label: 'Financial', value: '8,234', trend: { direction: 'neutral', text: '0.0%' } },
        { label: 'E-commerce', value: '6,248', trend: { direction: 'positive', text: '+3.4%' } },
        { label: 'Insurance', value: '4,122', trend: { direction: 'negative', text: '-1.5%' } },
        { label: 'Marketing', value: '5,467', trend: { direction: 'positive', text: '+0.8%' } },
      ],
      footer: {
        label: 'Total earning',
        value: '$18,875',
        trend: { direction: 'positive', text: 'Compared to last month 4.2%' },
      },
    },
  },
  ALL: {
    overview: {
      ...BASE_OVERVIEW,
      quantity: { ...BASE_OVERVIEW.quantity, value: '256,824' },
      rows: [
        { label: 'Server', value: '4,128' },
        { label: 'Clients', value: '18,942' },
        { label: 'Payments', value: '11,804' },
        { label: 'Responses', value: '8,642' },
        { label: 'Users', value: '22,318' },
        { label: 'Errors', value: '1,204' },
      ],
      summary: {
        label: 'Total earning',
        value: '$54,280',
        trend: { direction: 'positive', text: '+6.9%' },
      },
    },
    performance: {
      ...BASE_PERFORMANCE,
      centerValue: '$92,115',
      categories: [
        { key: 'design', label: 'Design', amount: '$24,820' },
        { key: 'startup', label: 'Startup', amount: '$62,118' },
        { key: 'business', label: 'Business', amount: '$164,842' },
        { key: 'investment', label: 'Investment', amount: '$418,624' },
        { key: 'product', label: 'Product', amount: '$88,412' },
        { key: 'development', label: 'Development', amount: '$54,918' },
      ],
      datasets: [
        {
          id: 'business',
          label: 'Business',
          total: '184,624',
          className: 'primary',
          values: {
            design: 68,
            startup: 80,
            business: 92,
            investment: 76,
            product: 84,
            development: 72,
          },
        },
        {
          id: 'investment',
          label: 'Investment',
          total: '486,214',
          className: 'secondary',
          values: {
            design: 60,
            startup: 74,
            business: 86,
            investment: 99,
            product: 90,
            development: 78,
          },
        },
      ],
    },
    totals: {
      ...BASE_TOTALS,
      eyebrow: 'Last year',
      highlight: {
        value: '$46,820',
        trend: { direction: 'positive', text: '+12.4%' },
      },
      list: [
        { label: 'Travel', value: '28,642', trend: { direction: 'positive', text: '+4.2%' } },
        { label: 'Medical', value: '12,284', trend: { direction: 'positive', text: '+2.6%' } },
        { label: 'Financial', value: '34,908', trend: { direction: 'neutral', text: '+0.3%' } },
        { label: 'E-commerce', value: '26,418', trend: { direction: 'positive', text: '+5.1%' } },
        { label: 'Insurance', value: '18,204', trend: { direction: 'negative', text: '-0.9%' } },
        { label: 'Marketing', value: '22,618', trend: { direction: 'positive', text: '+1.5%' } },
      ],
      footer: {
        label: 'Total earning',
        value: '$112,420',
        trend: { direction: 'positive', text: 'Compared to lifetime average 5.6%' },
      },
    },
  },
};
