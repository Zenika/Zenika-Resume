import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { MuiThemeProvider, createMuiTheme, Theme, createStyles } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/core/styles';
import {Resumes} from "../api/api"

import MyResumes from './home/MyResumes';
import LastResumes from './home/LastResumes';

const theme = createMuiTheme({
  palette: {
    primary: { main: '#383D43' },
    secondary: { main: '#B31835' },
  },
});

const styles = (theme: Theme)  => createStyles({
  appBar: {
    position: 'relative',
  },
  icon: {
    marginRight: theme.spacing(2),
  },
  layout: {
    width: 'auto',
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(3),
    [theme.breakpoints.up(1100 + theme.spacing(3) * 2)]: {
      width: 1100,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  cardGrid: {
    padding: `${theme.spacing(8)}px 0`,
  },
});

const Home: React.FC<Resumes> = (props) => {

  // const { classes } = props;

  return (
    <MuiThemeProvider theme={theme}>
      {/* <div className={classNames(classes.layout, classes.cardGrid)}> */}
        <MyResumes></MyResumes>
        <br/>
        <LastResumes {...props}></LastResumes> 
      {/* </div> */}
    </MuiThemeProvider>
  )
}

export default withStyles(styles)(Home);