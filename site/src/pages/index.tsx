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
    icon: '🤖',
    titleId: 'home.section.agents',
    titleDefault: 'Agents',
    descId: 'home.section.agents.desc',
    descDefault: 'Agent-first platform. MCP tools, authentication, RBAC, and end-to-end guides for AI agents.',
    link: '/docs/agents/overview',
  },
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
    titleDefault: 'API Reference',
    descId: 'home.section.api.desc',
    descDefault: '88 MCP tools and full REST API. Auto-generated per entity.',
    link: '/docs/api/mcp-tools',
  },
  {
    icon: '🚀',
    titleId: 'home.section.deploy',
    titleDefault: 'Deployment',
    descId: 'home.section.deploy.desc',
    descDefault: 'Static sites, GitHub Actions, custom domains, deploy tokens.',
    link: '/docs/deployment/static-sites',
  },
  {
    icon: '🔐',
    titleId: 'home.section.admin',
    titleDefault: 'Admin',
    descId: 'home.section.admin.desc',
    descDefault: 'Users, roles, webhooks, flows, secrets, knowledge base.',
    link: '/docs/admin/users',
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
            Agent-first platform for building business apps. Entities, rules, RBAC, and automations — all through MCP tools or REST API.
          </Translate>
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/agents/overview">
            <Translate id="home.hero.cta">Agent Guide</Translate>
          </Link>
          <Link
            className="button button--secondary button--outline button--lg"
            to="/docs/getting-started/quick-start">
            <Translate id="home.hero.quickstart">Quick Start</Translate>
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

function HumanBanner() {
  return (
    <section className={styles.humanBanner}>
      <div className="container">
        <p className={styles.humanBannerText}>
          <Translate id="home.human.banner">
            You don't need to read these docs. Tell your AI agent what you want to build — it already knows how to use Fyso.
          </Translate>
        </p>
      </div>
    </section>
  );
}

const youDontNeed = [
  {label: 'Cloudflare', detail: 'CDN, DNS, SSL'},
  {label: 'S3 / R2', detail: 'Object storage'},
  {label: 'Containers', detail: 'Docker, Kubernetes'},
  {label: 'Auto-scaling', detail: 'Load balancers'},
  {label: 'Auth systems', detail: 'OAuth, JWT, sessions'},
  {label: 'Database admin', detail: 'Postgres, migrations'},
  {label: 'CI/CD pipelines', detail: 'Build, test, deploy'},
  {label: 'Security', detail: 'SSRF, XSS, RBAC'},
];

function YouDontNeedThis() {
  return (
    <section className={styles.dontNeed}>
      <div className="container">
        <Heading as="h2" className={styles.dontNeedTitle}>
          <Translate id="home.dontneed.title">
            You don't need to know any of this
          </Translate>
        </Heading>
        <p className={styles.dontNeedSubtitle}>
          <Translate id="home.dontneed.subtitle">
            Fyso handles the infrastructure. You just define your business rules.
          </Translate>
        </p>
        <div className={styles.dontNeedGrid}>
          {youDontNeed.map((item) => (
            <div key={item.label} className={styles.dontNeedItem}>
              <span className={styles.dontNeedStrike}>{item.label}</span>
              <span className={styles.dontNeedDetail}>{item.detail}</span>
            </div>
          ))}
        </div>
        <p className={styles.dontNeedCta}>
          <Translate id="home.dontneed.cta">
            Just tell your agent: "create an entity called invoices with client, amount, and status" — done.
          </Translate>
        </p>
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
          <span className={styles.linkIcon}>🔧</span>
          <Translate id="home.link.mcp">88 MCP Tools</Translate>
        </Link>
        <Link to="/docs/agents/authentication" className={styles.linkItem}>
          <span className={styles.linkIcon}>🔑</span>
          <Translate id="home.link.auth">Authentication</Translate>
        </Link>
        <Link to="/docs/api/rest-api" className={styles.linkItem}>
          <span className={styles.linkIcon}>🔌</span>
          <Translate id="home.link.rest">REST API</Translate>
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
        <HumanBanner />
        <SectionCards />
        <YouDontNeedThis />
        <InstallSnippet />
        <ResourceLinks />
      </main>
    </Layout>
  );
}
