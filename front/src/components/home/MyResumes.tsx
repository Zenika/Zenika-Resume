import React, { Component } from 'react';

import { Resumes } from "../../Types/Resumes"
import Grid from '@material-ui/core/Grid';
import ResumeCard from '../ResumeCard';
import Button from '@material-ui/core/Button';
import { Router, Link } from "@reach/router"

const MyResumes: React.FC<Resumes> = ({ resumes }) => {
  if (!resumes) return (
    <div>
      <h4>
        My Resumes
    </h4>
      <p>Chargement de vos CV</p>
    </div>
  )
  return (
    <div>
      <h4>
        My Resumes
    </h4>
      <Grid container justify="center" spacing={4}>
        {resumes.map(resume => (
          <Grid item key={resume.uuid} sm={6} md={4} lg={3}>
            <ResumeCard resume={resume}></ResumeCard>
          </Grid>
        ))}
      </Grid>
      <div>
        <Link to={`app/`}>
          <Button variant="contained" size="large" color="secondary" >
            New resume
          {/* <NoteAdd className={this.classes.rightIcon} /> */}
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default MyResumes;