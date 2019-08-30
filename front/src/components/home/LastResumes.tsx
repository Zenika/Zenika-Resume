import React, { ReactElement } from 'react';
import {Resumes} from "../../api/api"
import Grid from '@material-ui/core/Grid';
import ResumeCard from '../ResumeCard';

const LastResumes: React.FC<Resumes> = ( {resumes} ) => {
  if (!resumes) return (
    <div>
      <h4>
        Last edited Resumes
      </h4>
      <p>Chargement des CV</p>
    </div>
  )
    return (
      <div>
        <h4>
          Last edited Resumes
        </h4>
        <Grid container justify="center" spacing={4}> 
          {resumes && resumes.map(resume => (
            // <p key={resume.uuid}>{resume.path}</p>
            <Grid item key={resume.uuid} sm={6} md={4} lg={3}>
               <ResumeCard resume={resume}></ResumeCard>
             </Grid>
          ))}
        </Grid>
        {/* <div className={this.classes.footer}>
          <Link to={`list`}>
            <Button variant="contained" size="large" color="primary">
              View all
            </Button>
          </Link>
        </div> */}
      </div>
    )
}

export default LastResumes;