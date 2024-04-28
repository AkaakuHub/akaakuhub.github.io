import type { GatsbyConfig } from "gatsby";

require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
});

const config: GatsbyConfig = {
  siteMetadata: {
    title: `akaakuhub`,
    siteUrl: `https://akaakuhub.github.io`
  },
  graphqlTypegen: true,
  plugins: ["gatsby-plugin-sitemap", {
    resolve: 'gatsby-source-filesystem',
    options: {
      "name": "pages",
      "path": "./src/pages/"
    },
    __key: "pages"
  },
    {
      resolve: "gatsby-plugin-google-gtag",
      options: {
        trackingIds: [
          process.env.GATSBY_GA_ID,
        ],
        pluginConfig: {
          head: true
        },
      },
    }
  ]
};

export default config;
