import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';
import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({});

const styles = ({
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
    textAlign: 'center',
  },
});

class Bye extends Component {

  constructor(props) {
    super(props);
    const { classes } = props;
    this.classes = classes;
  }

  render() {
    return (
      <div className={classNames(this.classes.layout, this.classes.cardGrid)}>
        <h4>Bye bye</h4>
        <br /><br />
        <img src="https://media.giphy.com/media/UQaRUOLveyjNC/source.gif" alt="byebye"/>
      </div>
    )
  }
}

Bye.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Bye);