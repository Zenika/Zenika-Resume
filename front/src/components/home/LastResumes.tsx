import React, { ReactElement } from 'react';
import {Resumes} from "../../api/api"

const LastResumes: React.FC<Resumes> = ( {resumes} ) => {
  console.log('resumes : ', resumes)
    return (
      <div>
        <h4>
          Last edited Resumes
        </h4>
        {/* <Grid container justify="center" spacing={40}> */}
          {resumes && resumes.map(resume => (
            <p key={resume.uuid}>{resume.path}</p>
            // <Grid item key={resume.uuid} sm={6} md={4} lg={3}>
            //   <ResumeCard data={resume}></ResumeCard>
            // </Grid>
          ))}
        {/* </Grid>
        <div className={this.classes.footer}>
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