import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/core/styles';

import MyResumes from './home/MyResumes';
import LastResumes from './home/LastResumes';

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

function Home(props) {

  const { classes } = props;

  return (
    <MuiThemeProvider theme={theme}>
      <div className={classNames(classes.layout, classes.cardGrid)}>
        <MyResumes></MyResumes>
        <br/>
        <LastResumes></LastResumes> 
      </div>
    </MuiThemeProvider>
  )
}

Home.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Home);