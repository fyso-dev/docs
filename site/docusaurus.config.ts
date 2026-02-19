import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Fyso Docs',
  tagline: 'Build business apps with AI',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://docs.sites.fyso.dev',
  baseUrl: '/',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/fyso-dev/docs/tree/main/site/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Fyso Docs',
      logo: {
        alt: 'Fyso Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentación',
        },
        {
          href: 'https://app.fyso.dev',
          label: 'Panel',
          position: 'right',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/fyso-dev/docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentación',
          items: [
            {
              label: 'Inicio',
              to: '/docs',
            },
            {
              label: 'Entidades',
              to: '/docs/category/entidades',
            },
            {
              label: 'API REST',
              to: '/docs/category/api-rest',
            },
          ],
        },
        {
          title: 'Plataforma',
          items: [
            {
              label: 'Panel',
              href: 'https://app.fyso.dev',
            },
            {
              label: 'Landing',
              href: 'https://fyso.dev',
            },
          ],
        },
        {
          title: 'Comunidad',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/fyso-dev/docs',
            },
          ],
        },
        {
          title: 'Legal',
          items: [
            {
              label: 'Privacidad',
              href: 'https://app.fyso.dev/privacy',
            },
            {
              label: 'Términos',
              href: 'https://app.fyso.dev/terms',
            },
            {
              label: 'Cookies',
              href: 'https://app.fyso.dev/cookies',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Fyso. Hecho en España.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
