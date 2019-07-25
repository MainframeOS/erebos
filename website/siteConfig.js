/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// See https://docusaurus.io/docs/site-config for all the possible
// site configuration options.

// List of projects/orgs using your project for the users page.
// const users = [
//   {
//     caption: 'User1',
//     // You will need to prepend the image path with your baseUrl
//     // if it is not '/', like: '/test-site/img/docusaurus.svg'.
//     image: '/img/docusaurus.svg',
//     infoLink: 'https://www.facebook.com',
//     pinned: true,
//   },
// ]

module.exports = {
  title: 'erebos', // Title for your website.
  tagline: 'JavaScript client and CLI for Swarm v0.4.x',
  url: 'https://erebos.js.org', // Your website URL
  baseUrl: '/', // Base URL for your project
  cname: 'erebos.js.org',

  // Used for publishing and more
  projectName: 'erebos',
  organizationName: 'MainframeHQ',

  // For no header links in the top nav bar -> headerLinks: [],
  headerLinks: [
    { doc: 'introduction', label: 'Docs' },
    { doc: 'examples-storage', label: 'Examples' },
    { doc: 'swarm-client', label: 'API' },
    { page: 'help', label: 'Help' },
    { href: 'https://github.com/MainframeHQ/erebos', label: 'GitHub' },
    { search: true },
  ],

  /* path to images for header/footer */
  headerIcon: 'img/erebos-white.png',
  favicon: 'img/favicon/favicon.ico',

  /* Colors for website */
  colors: {
    primaryColor: '#142543',
    secondaryColor: '#00a7e7',
  },

  // This copyright info is used in /core/Footer.js and blog RSS/Atom feeds.
  copyright: `Copyright © ${new Date().getFullYear()} Mainframe`,

  highlight: {
    defaultLang: 'javascript',
    // Highlight.js theme to use for syntax highlighting in code blocks.
    theme: 'mono-blue',
  },

  // Add custom scripts here that would be placed in <script> tags.
  scripts: ['https://buttons.github.io/buttons.js'],

  stylesheets: [
    'https://fonts.googleapis.com/css?family=Muli',
    'https://fonts.googleapis.com/css?family=Poppins',
  ],

  // On page navigation for the current documentation page.
  onPageNav: 'separate',
  // No .html extensions for paths.
  cleanUrl: true,
  scrollToTop: true,

  editUrl: 'https://github.com/MainframeHQ/erebos/edit/master/docs/',

  algolia: {
    apiKey: 'dd61149aed25a2c9c7e6f13d6b0632c0',
    indexName: 'erebos',
    algoliaOptions: {
      facetFilters: ['language:en'],
    },
  },

  // Open Graph and Twitter card images.
  // ogImage: 'img/docusau rus.png',
  // twitterImage: 'img/docusaurus.png',

  // You may provide arbitrary config keys to be used as needed by your
  // template. For example, if you need your repo's URL...
  repoUrl: 'https://github.com/MainframeHQ/erebos',
}
