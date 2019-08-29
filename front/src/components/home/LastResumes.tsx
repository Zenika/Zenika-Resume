import React, { ReactElement } from 'react';

type LastResumeProps = {
  resumes: [{
    last_modified: String,
    metadata: {
      agency: String,
      column1: String,
      column2: String,
      column3: String,
      description: String,
      email: String,
      experience: String,
      firstname: String,
      lang: String,
      name: String,
      theme: String
    },
    path: String,
    uuid: String,
    version: String
  }]
}

const LastResumes: React.FC<LastResumeProps> = ( lastResumeProps ) => {
  // constructor(props) {
  //   super(props);

  //   const { classes } = props;
  //   this.classes = classes;

  //   this.state = { resumes: [] };
  // }

  // componentDidMount() {
  //   authorizedFetch(`/resumes`)
  //     .then(res => res.json())
  //     .then(data => {
  //       this.setState({ resumes: data.slice(0, 8) });
  //     });
  // }
    return (
      <div>
        <h4>
          Last edited Resumes
        </h4>
        {/* <Grid container justify="center" spacing={40}> */}
          {lastResumeProps.resumes.map(resume => (
            <p>{resume}</p>
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