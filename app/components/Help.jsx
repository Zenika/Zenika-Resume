import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/core/styles';

import {
  addLocaleData,
  IntlProvider,
  FormattedMessage,
} from 'react-intl';
// import en from 'react-intl/locale-data/en';
// import fr from 'react-intl/locale-data/fr';

// addLocaleData([...en, ...fr]);

import Translations from '../Translations';
import Header from './Header';

const theme = createMuiTheme({
  palette: {
    primary: { main: '#383D43' },
    secondary: { main: '#B31835' },
  },
});

const styles = theme => ({
  appBar: {
    position: 'relative',
  },
  icon: {
    marginRight: theme.spacing.unit * 2,
  },
  layout: {
    width: 'auto',
    marginLeft: theme.spacing.unit * 3,
    marginRight: theme.spacing.unit * 3,
    [theme.breakpoints.up(1100 + theme.spacing.unit * 3 * 2)]: {
      width: 1100,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  cardGrid: {
    padding: `${theme.spacing.unit * 8}px 0`,
  },
});

class Help extends Component {

  constructor(props) {
    super(props);
    const { classes } = props;
    this.classes = classes;

  }

  render() {

    const locale = navigator.language === 'fr-FR' ? navigator.language : 'en-US'
    const messages = Translations[locale];

    return (
      <IntlProvider
        locale={locale}
        messages={messages}
      >
        <MuiThemeProvider theme={theme}>
          <div className={classNames(this.classes.layout, this.classes.cardGrid)}>
            <h4><FormattedMessage id="phew" /></h4>
            <br/><br/>
            <div>
              <iframe
                width="640"
                height="360"
                src="https://www.youtube.com/embed/p_t7716ymoI"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>

              <p className="dummyTest">
              </p>
              <p className="lead"><FormattedMessage id="print" /></p>
              <p>
                <FormattedMessage id="the" /><br />
                <FormattedMessage id="between" /><br />
                <br />
                <FormattedMessage id="in" /><br />
                <FormattedMessage id="the2" /><br />
                <FormattedMessage id="then" /><br />
                <FormattedMessage id="for" />
              </p>
              <p className="lead"><FormattedMessage id="describe" /></p>
              <p>
                <FormattedMessage id="experience" /><br />
                <FormattedMessage id="styles" /><br />
                --section-start<br />
                --section-end<br />
                <br />
                <FormattedMessage id="between2" /><br />
                <FormattedMessage id="your" /><br />
                <br />
                <FormattedMessage id="the3" /><br />
                <FormattedMessage id="the4" /><br />
                <br />
                <FormattedMessage id="the5" /><br />
                <FormattedMessage id="the6" /><br />
                <br />
                <FormattedMessage id="to" /><br />
                <FormattedMessage id="two" /><br />
                <FormattedMessage id="the7" /><br />
                &nbsp; &nbsp; <FormattedMessage id="a" /><br />
                &nbsp; &nbsp; <FormattedMessage id="then2" /><br />
                <br />
              </p>

              <p className="lead"><FormattedMessage id="variable" /></p>
              <p>
                <FormattedMessage id="at" /><br />
                <FormattedMessage id="section" /><br />
                <FormattedMessage id="role" /><br />
                <FormattedMessage id="the8" /><br />
                <FormattedMessage id="for2" /><br />
                <FormattedMessage id="you" /><br /><br />
              </p>

              <p className="lead"><FormattedMessage id="using" /></p>
              <p>
                <FormattedMessage id="there" /><br />
                <FormattedMessage id="it" /><br />
                --expertise-archive.<br />
                <br />
                <FormattedMessage id="here" /><br />
                --expertise-archive<br />
                --expertise-cloud<br />
                --expertise-file<br />
                --expertise-flag<br />
                --expertise-leaf<br />
                --expertise-talk<br /><br />
              </p>

              <p className="lead"><FormattedMessage id="jump" /></p>
              <p>
                <FormattedMessage id="this" /><br />
                <FormattedMessage id="what" /><br />
                --break-page<br />
              </p>

              <p className="lead"><FormattedMessage id="tip" /></p>
              <p>
                <FormattedMessage id="in2" /> <br />
                <FormattedMessage id="example" /><br />
              </p>

            </div>
          </div>
        </MuiThemeProvider>
      </IntlProvider>
    )
  }
}

Help.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Help);