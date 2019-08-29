import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';

import { authorizedFetch } from '../../logic/auth';

const styles = theme => ({
  footer: {
    textAlign: 'center',
    padding: '25px',
  },
  button: {
    margin: theme.spacing(),
  },
  leftIcon: {
    marginRight: theme.spacing(),
  },
  rightIcon: {
    marginLeft: theme.spacing(),
  },
  iconSmall: {
    fontSize: 20,
  },
});

class MyResumes extends Component {
  constructor(props) {
    super(props);

    const { classes } = props;
    this.classes = classes;

    this.state = { resumes: [] };
  }

  componentDidMount() {
    authorizedFetch(`/resumes/mine`)
      .then(data => {
        this.setState({ resumes: data });
      });
  }

  render() {

    return (
      <div>
        <h4>
          My Resumes
      </h4>
      </div>
    )
  }
}

export default withStyles(styles)(MyResumes);