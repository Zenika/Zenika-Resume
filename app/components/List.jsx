import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom'

import { createMuiTheme } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/core/styles';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Avatar from '@material-ui/core/Avatar';
import SearchIcon from '@material-ui/icons/Search';
import Input from '@material-ui/core/Input';
import { abortableAuthorizedFetch } from '../auth';
import debounce from "lodash.debounce";

const theme = createMuiTheme();

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
  avatar: {
    borderRadius: '10%',
  },
  table: {
    minWidth: 700,
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    background: '#c30030',
    color: 'white',
    backgroundColor: '#c30030',
    marginLeft: 0,
    width: '100%',
  },
  searchIcon: {
    width: theme.spacing.unit * 9,
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchTip: {
    marginBottom: '20px'
  },
  inputRoot: {
    color: 'white',
    width: '100%',
  },
  inputInput: {
    '&:focus': {
      background: 'none',
    },
    paddingTop: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit * 10,
    transition: theme.transitions.create('width'),
    width: '100%',
  },
  link: {
    color: 'black',
  }
});

const lastModifiedFormatter = new Intl.DateTimeFormat()

class ListAll extends Component {

  constructor(props) {
    super(props);
    const { classes } = props;
    this.classes = classes;
    this.state = { resumes: [], abortFetch: () => {} };
  }
  
  componentDidMount() {
    this.searchResumesWithDebounce = debounce(this.searchResumes.bind(this), 200);
  }

  componentWillUnmount() {
    this.searchResumesWithDebounce.cancel();
  }

  searchResumes(search) {
    const url = new URL("/resumes", "http://example.com");
    url.searchParams.set("search", search);
    this.state.abortFetch();
    const { promise, abort } = abortableAuthorizedFetch(url.pathname + url.search);
    this.setState({ abortFetch: abort })
    promise
      .then((res) => res.json())
      .then((data) => {
        this.setState({ resumes: data });
      });
  }

  render() {
    return (
        <div className={classNames(this.classes.layout, this.classes.cardGrid)}>
          <div className={this.classes.search}>
            <div className={this.classes.searchIcon}>
              <SearchIcon />
            </div>
            <Input
              placeholder="Search…"
              disableUnderline
              classes={{
                root: this.classes.inputRoot,
                input: this.classes.inputInput,
              }}
              onChange={event => this.searchResumesWithDebounce(event.target.value)}
            />
          </div>
          <div className={this.classes.searchTip}>
            <small>Tip: use quotes to match exact phrases, the OR keyword to match at least one term, and the minus sign to exclude terms</small>
          </div>

          <Paper className={this.classes.root}>
            <Table className={this.classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Names</TableCell>
                  <TableCell>Editing</TableCell>
                  <TableCell>Viewing</TableCell>
                  <TableCell>Agency</TableCell>
                  <TableCell>Lang</TableCell>
                  <TableCell>Last modified</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {this.state.resumes.map(resume => {
                  return (
                    <TableRow key={resume.uuid}>
                      <TableCell component="th" scope="resume">
                        <Avatar className={this.classes.avatar} alt="Resume theme" src={`/static/img/theme-${resume.metadata.theme ? resume.metadata.theme : 'default'}.png`} />
                      </TableCell>
                      <TableCell>
                        {resume.metadata.firstname} {resume.metadata.name}
                      </TableCell>
                      <TableCell>
                        <Link className={this.classes.link}  to={`app/${resume.uuid}`}>
                          Edit
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link className={this.classes.link}  to={`app/${resume.uuid}/view`}>
                          View
                        </Link>
                      </TableCell>
                      <TableCell>
                        {resume.metadata.agency}
                      </TableCell>
                      <TableCell>
                        {resume.metadata.lang}
                      </TableCell>
                      <TableCell>
                        {lastModifiedFormatter.format(new Date(resume.last_modified))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        </div>
    )
  }
}

ListAll.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ListAll);
