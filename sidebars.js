/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

module.exports = {
    // By default, Docusaurus generates a sidebar from the docs folder structure
    docsSidebar: [
        {
            type: 'doc',
            id: 'index',
            label: 'Home',
        },
        {
            type: 'category',
            label: 'Getting Started',
            items: [
                'guides/quickstart',
                'concepts',
                'MIGRATION_V2',
            ],
        },
        {
            type: 'category',
            label: 'Guides',
            items: [
                'guides/pagination',
                'guides/error-handling',
            ],
        },
        {
            type: 'category',
            label: 'Recipes & Examples',
            items: [
                'recipes/examples',
            ],
        },
        {
            type: 'category',
            label: 'Reference',
            items: [
                'reference/config',
            ],
        },
        {
            type: 'link',
            label: 'API Reference',
            href: '/api/',
        },
        {
            type: 'doc',
            id: 'troubleshooting',
            label: 'Troubleshooting',
        },
        {
            type: 'doc',
            id: 'llm-context',
            label: 'LLM Context',
        },
    ],
};

