import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom'

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Avatar from '@material-ui/core/Avatar';
import ExitToApp from '@material-ui/icons/ExitToApp';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import { withStyles } from '@material-ui/core/styles';
import AccountCircle from '@material-ui/icons/AccountCircle';
import InputIcon from '@material-ui/icons/Input';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import { authorizedFetch } from '../auth';

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  logo: {
    height: '50px',
  },
  grow: {
    flexGrow: 1,
    padding: 15,
  },
  toolBar: {
    justifyContent: 'space-between',
  },
  menuItem: {
    color: 'black'
  },
  button: {
    margin: theme.spacing.unit,
  },
  leftIcon: {
    marginRight: theme.spacing.unit,
  },
  rightIcon: {
    marginLeft: theme.spacing.unit,
  },
});

class Header extends Component {

  constructor(props) {
    super(props);
    const { classes } = props;
    this.classes = classes;
    this.state = { anchorEl: null, me: null, isDisconnected: null };

    this.handleChange = this.handleChange.bind(this);
    this.handleMenu = this.handleMenu.bind(this);
    this.handleClose = this.handleClose.bind(this);

  }

  componentDidMount() {

    if (window.location.hash === '#/bye') {
      this.setState({ isDisconnected: true })
      return
    }
    authorizedFetch(`/me`)
      .then(res => res.json())
      .then(data => {
        this.setState({ me: data });
      });
  }

  handleChange(event) {
    this.setState({ auth: event.target.checked });
  };

  handleMenu(event) {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose() {
    this.setState({ anchorEl: null });
  };

  render() {

    if(window.location.hash.includes('#/app')) return (<div/>);

    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    const avatar = (this.state.me && this.state.me.photos[0] && this.state.me.photos[0].value) ? this.state.me.photos[0].value : '';

    return (
      <div className={this.classes.root}>
        <AppBar position="static" color="secondary">
          <Toolbar className={this.classes.toolBar}>
            <Link to={`/`}>
              <Typography variant="title" color="inherit">
                <img height="50" src="static/img/logo.png" alt="" className={this.classes.logo} /> Zenika Resumes 📑
            </Typography>
            </Link>
            <Typography variant="title" color="inherit">
              This app is a prototype, please ensure you save your own copy of your resume
            </Typography>
            {(this.state.isDisconnected) ? (
              <a href="/login/google">
                <Button variant="contained" color="default" className={this.classes.button}>
                  Login
                  <InputIcon className={this.classes.rightIcon} />
                </Button>
              </a>
            ) : (
                <Toolbar>
                  <Link to={`/`}>
                    <Typography variant="subheading" color="inherit" className={this.classes.grow}>Home</Typography>
                  </Link> -
                   <Link to={`list`}>
                    <Typography variant="subheading" color="inherit" className={this.classes.grow}>List</Typography>
                  </Link> -
                  <Link to={`help`}>
                    <Typography variant="subheading" color="inherit" className={this.classes.grow}>Help</Typography>
                  </Link>
                  <div>
                    <IconButton
                      aria-owns={open ? 'menu-appbar' : null}
                      aria-haspopup="true"
                      onClick={this.handleMenu}
                      color="inherit"
                    >
                      {avatar ? (
                        <Avatar alt="Remy Sharp" src={avatar} className={this.classes.avatar} />
                      ) : (
                          <AccountCircle />
                        )
                      }
                    </IconButton>
                    <Menu
                      id="menu-appbar"
                      anchorEl={anchorEl}
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      open={open}
                      onClose={this.handleClose}
                    >
                      <MenuItem className={this.classes.menuItem}>
                        <ListItemIcon className={this.classes.icon}>
                          <AccountCircle />
                        </ListItemIcon>
                        {(
                          this.state.me &&
                          <ListItemText classes={{ primary: this.classes.primary }} inset primary={this.state.me.displayName} />
                        )}
                      </MenuItem>
                      <a href="/logout">
                        <MenuItem className={this.classes.menuItem}>
                          <ListItemIcon className={this.classes.icon}>
                            <ExitToApp />
                          </ListItemIcon>
                          <ListItemText classes={{ primary: this.classes.primary }} inset primary="Logout" />
                        </MenuItem>
                      </a>
                    </Menu>
                  </div>
                </Toolbar>
              )}
          </Toolbar>
        </AppBar>
      </div>
    );
  }
}

Header.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Header);
