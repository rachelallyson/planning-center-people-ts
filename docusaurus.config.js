// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: 'Planning Center People TypeScript Library',
    tagline: 'A type-safe TypeScript client for the Planning Center Online People API',
    url: 'https://rachelallyson.github.io',
    baseUrl: '/planning-center-people-ts/',
    onBrokenLinks: 'throw',
    markdown: {
        hooks: {
            onBrokenMarkdownLinks: 'warn',
        },
    },
    favicon: 'img/favicon.ico',

    // GitHub pages deployment config.
    organizationName: 'rachelallyson',
    projectName: 'planning-center-people-ts',
    trailingSlash: false,

    // Even if you don't use internalization, you can use this field to set useful
    // metadata like html lang. For example, if your site is Chinese, you may want
    // to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    presets: [
        [
            'classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    path: 'docs',
                    routeBasePath: '/', // Serve docs at root
                    sidebarPath: require.resolve('./sidebars.js'),
                    // Remove the default docs-only mode banner
                    editUrl: 'https://github.com/rachelallyson/planning-center-people-ts/tree/main/',
                    remarkPlugins: [],
                    rehypePlugins: [],
                },
                blog: false, // Disable blog
                theme: {
                    customCss: require.resolve('./css/custom.css'),
                },
            }),
        ],
    ],

    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            navbar: {
                title: 'Planning Center People TS',
                logo: {
                    alt: 'Planning Center People TS Logo',
                    src: 'img/logo.svg',
                    href: '/',
                },
                items: [
                    {
                        type: 'doc',
                        docId: 'index',
                        position: 'left',
                        label: 'Documentation',
                    },
                    {
                        href: 'https://github.com/rachelallyson/planning-center-people-ts',
                        label: 'GitHub',
                        position: 'right',
                    },
                ],
            },
            footer: {
                style: 'dark',
                links: [
                    {
                        title: 'Docs',
                        items: [
                            {
                                label: 'Getting Started',
                                to: '/guides/quickstart',
                            },
                            {
                                label: 'API Reference',
                                to: '/api/',
                            },
                            {
                                label: 'Migration Guide',
                                to: '/MIGRATION_V2',
                            },
                        ],
                    },
                    {
                        title: 'Community',
                        items: [
                            {
                                label: 'GitHub',
                                href: 'https://github.com/rachelallyson/planning-center-people-ts',
                            },
                            {
                                label: 'Issues',
                                href: 'https://github.com/rachelallyson/planning-center-people-ts/issues',
                            },
                        ],
                    },
                    {
                        title: 'More',
                        items: [
                            {
                                label: 'Planning Center API',
                                href: 'https://developer.planning.center/docs/#/people',
                            },
                            {
                                label: 'JSON:API Spec',
                                href: 'https://jsonapi.org/',
                            },
                        ],
                    },
                ],
                copyright: `Copyright © ${new Date().getFullYear()} Rachel Higley. Built with Docusaurus.`,
            },
            prism: {
                theme: lightCodeTheme,
                darkTheme: darkCodeTheme,
                additionalLanguages: ['typescript', 'bash', 'json'],
            },
        }),
};

module.exports = config;

