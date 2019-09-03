import React from 'react';

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';

import {Resume} from "../Types/Resume"

const ResumeCard: React.FC<{resume: Resume}> = ( {resume} ) => {
    console.log(resume)
    return (
        <div>
            <Card>
                <CardMedia
                    image={`/static/img/theme-${resume.metadata.theme ? resume.metadata.theme : 'default'}.png`}
                    title="Image title"
                />
                <CardContent>
                    <Typography gutterBottom component="h2">
                        {resume.metadata.firstname} {resume.metadata.name}
                    </Typography>
                    <Typography>
                        {resume.metadata.description}
                    </Typography>
                </CardContent>
                <CardActions>
                    {/* <Link to={`app/${resume.path}`}> */}
                        <Button variant="contained" color="primary">
                            View
                        </Button>
                    {/* </Link>
                    <Link to={`app/${resume.uuid}`}> */}
                        <Button variant="contained" color="secondary">
                            Edit
                        </Button>
                    {/* </Link> */}
                </CardActions>
            </Card>
        </div>
    )
}

export default ResumeCard;