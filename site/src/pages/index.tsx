import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const sections = [
  {
    icon: '🧩',
    titleId: 'home.section.entities',
    titleDefault: 'Entities',
    descId: 'home.section.entities.desc',
    descDefault: 'Define your data model with fields, relations, and publish when ready.',
    link: '/docs/entities/create-entity',
  },
  {
    icon: '⚙️',
    titleId: 'home.section.rules',
    titleDefault: 'Business Rules',
    descId: 'home.section.rules.desc',
    descDefault: 'Automate computations, validations, and actions with a simple DSL.',
    link: '/docs/business-rules/overview',
  },
  {
    icon: '🔌',
    titleId: 'home.section.api',
    titleDefault: 'REST API',
    descId: 'home.section.api.desc',
    descDefault: 'Auto-generated API for every entity. Auth via API key.',
    link: '/docs/api/rest-api',
  },
  {
    icon: '📅',
    titleId: 'home.section.scheduling',
    titleDefault: 'Scheduling',
    descId: 'home.section.scheduling.desc',
    descDefault: 'Availability slots, bookings, and calendar management.',
    link: '/docs/scheduling/availability',
  },
  {
    icon: '🚀',
    titleId: 'home.section.deploy',
    titleDefault: 'Deployment',
    descId: 'home.section.deploy.desc',
    descDefault: 'Deploy static sites to Fyso with GitHub Actions.',
    link: '/docs/deployment/static-sites',
  },
  {
    icon: '📄',
    titleId: 'home.section.pdf',
    titleDefault: 'PDF Generation',
    descId: 'home.section.pdf.desc',
    descDefault: 'Create templates with pdfme and generate documents from records.',
    link: '/docs/pdf/templates',
  },
];

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={clsx('hero__title', styles.heroTitle)}>
          {siteConfig.title}
        </Heading>
        <p className={styles.heroSubtitle}>
          <Translate id="home.hero.subtitle">
            Build business apps with entities, rules, and AI. Operate from the web panel or MCP tools.
          </Translate>
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started/quick-start">
            <Translate id="home.hero.cta">Get Started</Translate>
          </Link>
          <Link
            className="button button--secondary button--outline button--lg"
            to="/docs/getting-started/mcp-setup"
            style={{borderColor: 'rgba(255,255,255,0.4)', color: '#fff'}}>
            <Translate id="home.hero.mcp">Configure MCP</Translate>
          </Link>
        </div>
      </div>
    </header>
  );
}

function SectionCards() {
  return (
    <section className={clsx('container', styles.sections)}>
      <div className={styles.sectionGrid}>
        {sections.map((s) => (
          <Link key={s.titleId} to={s.link} className={styles.card}>
            <div className={styles.cardIcon}>{s.icon}</div>
            <div className={styles.cardTitle}>
              <Translate id={s.titleId}>{s.titleDefault}</Translate>
            </div>
            <div className={styles.cardDesc}>
              <Translate id={s.descId}>{s.descDefault}</Translate>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function InstallSnippet() {
  return (
    <section className={styles.install}>
      <div className={clsx('container', styles.installInner)}>
        <Heading as="h2" className={styles.installTitle}>
          <Translate id="home.install.title">Connect AI agents in seconds</Translate>
        </Heading>
        <p className={styles.installDesc}>
          <Translate id="home.install.desc">
            Add Fyso as an MCP server to Claude, Cursor, or any MCP-compatible client.
          </Translate>
        </p>
        <div className={styles.codeBlock}>
          <code>
            claude mcp add fyso https://mcp.fyso.dev/mcp \{'\n'}
            {'  '}--header &quot;x-api-key: YOUR_API_KEY&quot;
          </code>
        </div>
      </div>
    </section>
  );
}

function ResourceLinks() {
  return (
    <section className={clsx('container', styles.links)}>
      <div className={styles.linkGrid}>
        <a
          href="https://github.com/fyso-dev/docs"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkItem}>
          <span className={styles.linkIcon}>📦</span>
          GitHub
        </a>
        <Link to="/docs/api/mcp-tools" className={styles.linkItem}>
          <span className={styles.linkIcon}>🤖</span>
          <Translate id="home.link.mcp">MCP Reference</Translate>
        </Link>
        <Link to="/docs/billing/plans" className={styles.linkItem}>
          <span className={styles.linkIcon}>💳</span>
          <Translate id="home.link.billing">Plans & Limits</Translate>
        </Link>
        <Link to="/docs/admin/users" className={styles.linkItem}>
          <span className={styles.linkIcon}>👤</span>
          <Translate id="home.link.admin">Users & Roles</Translate>
        </Link>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title={translate({id: 'home.layout.title', message: 'Home'})}
      description="Fyso documentation - Build business apps with AI">
      <HomepageHeader />
      <main>
        <SectionCards />
        <InstallSnippet />
        <ResourceLinks />
      </main>
    </Layout>
  );
}
