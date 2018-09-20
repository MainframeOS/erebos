/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react')

class Footer extends React.Component {
  docUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl
    return `${baseUrl}docs/${language ? `${language}/` : ''}${doc}`
  }

  pageUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl
    return baseUrl + (language ? `${language}/` : '') + doc
  }

  render() {
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <a href={this.props.config.baseUrl} className="nav-home">
            {this.props.config.footerIcon && (
              <img
                src={this.props.config.baseUrl + this.props.config.footerIcon}
                alt={this.props.config.title}
                width="66"
                height="58"
              />
            )}
          </a>
          <div>
            <h5>Docs</h5>
            <a href={this.docUrl('getting-started.html', this.props.language)}>
              Getting Started
            </a>
            <a href={this.docUrl('swarm-client.html', this.props.language)}>
              API Reference
            </a>
            <a href={this.docUrl('cli.html', this.props.language)}>CLI</a>
          </div>
          <div>
            <h5>Community</h5>
            {/* <a href={this.pageUrl('users.html', this.props.language)}>
              User Showcase
            </a> */}
            {/* <a
              href="http://stackoverflow.com/questions/tagged/"
              target="_blank"
              rel="noreferrer noopener">
              Stack Overflow
            </a> */}
            {/* <a href={`${this.props.config.baseUrl}blog`}>Blog</a> */}
            <a href="https://gitter.im/MainframeHQ/erebos">Gitter chat</a>
            {/* <a
              href="https://twitter.com/"
              target="_blank"
              rel="noreferrer noopener">
              Twitter
            </a> */}
            <a href="https://github.com/MainframeHQ/erebos">
              GitHub repository
            </a>
            <a
              className="github-button"
              href={this.props.config.repoUrl}
              data-icon="octicon-star"
              data-count-href="/MainframeHQ/erebos/stargazers"
              data-show-count="true"
              data-count-aria-label="# stargazers on GitHub"
              aria-label="Star this project on GitHub">
              Star
            </a>
          </div>
          <div>
            <h5>Swarm</h5>
            <a
              href="https://swarm-guide.readthedocs.io/en/latest/index.html"
              target="_blank"
              rel="noreferrer noopener">
              Official documentation
            </a>
            <a
              href="https://swarm-gateways.net/"
              target="_blank"
              rel="noreferrer noopener">
              HTTP gateway
            </a>
            <a
              href="https://gitter.im/ethereum/swarm"
              target="_blank"
              rel="noreferrer noopener">
              Gitter chat
            </a>
          </div>
        </section>

        <section className="copyright">{this.props.config.copyright}</section>
      </footer>
    )
  }
}

module.exports = Footer
