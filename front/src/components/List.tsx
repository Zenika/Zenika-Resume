import React, { useState, useEffect, ChangeEvent } from "react";
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Router, Link } from "@reach/router"

import { createMuiTheme } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/core/styles';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Avatar from '@material-ui/core/Avatar';
// import SearchIcon from '@material-ui/icons/Search';
import Input from '@material-ui/core/Input';
import { getResumes, getMyResumes, Resumes, Resume } from "../api/api"

// const theme = createMuiTheme();

// const styles = theme => ({
//   appBar: {
//     position: 'relative',
//   },
//   icon: {
//     marginRight: theme.spacing.unit * 2,
//   },
//   layout: {
//     width: 'auto',
//     marginLeft: theme.spacing.unit * 3,
//     marginRight: theme.spacing.unit * 3,
//     [theme.breakpoints.up(1100 + theme.spacing.unit * 3 * 2)]: {
//       width: 1100,
//       marginLeft: 'auto',
//       marginRight: 'auto',
//     },
//   },
//   cardGrid: {
//     padding: `${theme.spacing.unit * 8}px 0`,
//   },
//   avatar: {
//     borderRadius: '10%',
//   },
//   table: {
//     minWidth: 700,
//   },
//   search: {
//     position: 'relative',
//     borderRadius: theme.shape.borderRadius,
//     background: '#c30030',
//     marginBottom: '20px',
//     // borderBottomLeftRadius: 0,
//     // borderBottomRightRadius: 0,
//     color: 'white',
//     backgroundColor: '#c30030',
//     marginLeft: 0,
//     width: '100%',
//   },
//   searchIcon: {
//     width: theme.spacing.unit * 9,
//     height: '100%',
//     position: 'absolute',
//     pointerEvents: 'none',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   inputRoot: {
//     color: 'white',
//     width: '100%',
//   },
//   inputInput: {
//     '&:focus': {
//       background: 'none',
//     },
//     paddingTop: theme.spacing.unit,
//     paddingRight: theme.spacing.unit,
//     paddingBottom: theme.spacing.unit,
//     paddingLeft: theme.spacing.unit * 10,
//     transition: theme.transitions.create('width'),
//     width: '100%',
//   },
//   link: {
//     color: 'black',
//   }
// });


const ListAll: React.FC<Resumes> = () => {
  const [resumes, setResumes] = useState()
  const loadResumes = async () => setResumes(await getResumes());

  useEffect(() => {
    loadResumes()
  }, [])

  const [filteredResumes, setFilteredResumes] = useState()
  const loadFilteredResumes = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.currentTarget.value.length < 3) {
      setFilteredResumes(resumes);
    } else {
      setFilteredResumes(resumes.filter((resume: Resume) =>
        JSON.stringify(resume).toLocaleLowerCase().includes(event.currentTarget.value.toLocaleLowerCase())
      ));
    }
  }

  return (
    <div>
      <h4>Resumes ({resumes.length})</h4>
      <br /><br />
      <div>
        {/* <div>
              <SearchIcon />
            </div> */}
        <Input
          placeholder="Search…"
          disableUnderline
          onChange={loadFilteredResumes}
        />
      </div>

      <Paper>
        <Table>
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
            {filteredResumes.map((resume: Resume) => {
              return (
                <TableRow key={resume.uuid}>
                  <TableCell component="th" scope="resume">
                    <Avatar alt="Resume theme" src={`/static/img/theme-${resume.metadata.theme ? resume.metadata.theme : 'default'}.png`} />
                  </TableCell>
                  <TableCell>
                    {resume.metadata.firstname} {resume.metadata.name}
                  </TableCell>
                  <TableCell>
                    <Link to={`app/${resume.uuid}`}>
                      {resume.uuid}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link to={`app/${resume.path}`}>
                      {resume.path}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {resume.metadata.agency}
                  </TableCell>
                  <TableCell>
                    {resume.metadata.lang}
                  </TableCell>
                  <TableCell>
                    {resume.last_modified}
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

export default ListAll