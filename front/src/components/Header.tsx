import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from "@reach/router";
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Avatar from '@material-ui/core/Avatar';
import ExitToApp from '@material-ui/icons/ExitToApp';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import { withStyles, Theme } from '@material-ui/core/styles';
import AccountCircle from '@material-ui/icons/AccountCircle';
import InputIcon from '@material-ui/icons/Input';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { isAuthenticated, login, logout, auth, authInfo, getUserInfo } from '../logic/auth';
import { useAsyncEffect } from '../utils/async-use-effect';

const styles = (theme: Theme) => ({
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
    margin: theme.spacing()
  },
  leftIcon: {
    marginRight: theme.spacing()
  },
  rightIcon: {
    marginLeft: theme.spacing()
  },
});

type State = {
    auth?: boolean;
    anchorEl?: any;
    me?: any;
    isDisconnected?: boolean;
}

const Header = (props: any) => {
    const { classes } = props;
    const stateModel: State = {};
    const [state, setState] = useState(stateModel);

  useEffect(() => {
    if (window.location.hash === '#/bye') {
      setState({...state, ...{isDisconnected: true }})
      return
    }
    if (!isAuthenticated()) {
      login();
    }
  });

  const handleMenu = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setState({ anchorEl: event.currentTarget });
  };

  const handleClose = () => {
    setState({...state, ...{anchorEl: undefined }});
  };

  useAsyncEffect(async () => {
        getUserInfo(auth, authInfo.accessToken || "", (err, result) => {
            if(err) {
                console.error(err)
                return;
            }
            setState({...state, ...{me: result}})
        })
      })

    if(window.location.hash.includes('#/app')) return (<div/>);

    const open = Boolean(state.anchorEl);

    return (
      <div className={classes.root}>
        <AppBar position="static" color="secondary">
          <Toolbar className={classes.toolBar}>
            <Link to="/">
              <Typography variant="h1" color="inherit">
                <img height="50" src="static/img/logo.png" alt="" className={classes.logo} /> Zenika Resumes 📑
            </Typography>
            </Link>
            <Typography variant="h1" color="inherit">
              This app is a prototype, please ensure you save your own copy of your resume
            </Typography>
            {(state.isDisconnected) ? (
              <a href="/login/google">
                <Button variant="contained" color="default" className={classes.button}>
                  Login
                  <InputIcon className={classes.rightIcon} />
                </Button>
              </a>
            ) : (
                <Toolbar>
                  <Link to="/">
                    <Typography variant="subtitle1" color="inherit" className={classes.grow}>Home</Typography>
                  </Link> -
                   <Link to={`list`}>
                    <Typography variant="subtitle1" color="inherit" className={classes.grow}>List</Typography>
                  </Link> -
                  <Link to={`help`}>
                    <Typography variant="subtitle1" color="inherit" className={classes.grow}>Help</Typography>
                  </Link>
                  <div>
                    <IconButton
                      aria-owns={open ? 'menu-appbar' : undefined}
                      aria-haspopup="true"
                      onClick={handleMenu}
                      color="inherit"
                    >
                      {state.me.picture ? (
                        <Avatar alt={state.me.name} src={state.me.picture} className={classes.avatar} />
                      ) : (
                          <AccountCircle />
                        )
                      }
                    </IconButton>
                    <Menu
                      id="menu-appbar"
                      anchorEl={state.anchorEl}
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      open={open}
                      onClose={handleClose}
                    >
                      <MenuItem className={classes.menuItem}>
                        <ListItemIcon className={classes.icon}>
                          <AccountCircle />
                        </ListItemIcon>
                        {(
                          <ListItemText classes={{ primary: classes.primary }} inset primary={state.me.name} />
                        )}
                      </MenuItem>
                      <button onClick={() => logout()}>
                        <MenuItem className={classes.menuItem}>
                          <ListItemIcon className={classes.icon}>
                            <ExitToApp />
                          </ListItemIcon>
                          <ListItemText classes={{ primary: classes.primary }} inset primary="Logout" />
                        </MenuItem>
                      </button>
                    </Menu>
                  </div>
                </Toolbar>
              )}
          </Toolbar>
        </AppBar>
      </div>
    );
  }

Header.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Header);
