import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom'

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    card: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    cardMedia: {
        backgroundPosition: 'top center',
        paddingTop: '75%', // 16:9
        filter: 'blur(0px)',
    },
    cardContent: {
        flexGrow: 1,
        overflow: 'hidden', 
        height: '125px',
        marginBottom: '10px',
    },
    cardActions: {
        justifyContent: 'space-around',
    }
});

function ResumeCard(props) {

    const { classes, data } = props;

    return (
        <div>
            <Card className={classes.card}>
                <CardMedia
                    className={classes.cardMedia}
                    image={`/static/img/theme-${data.metadata.theme ? data.metadata.theme : 'default'}.png`}
                    title="Image title"
                />
                <CardContent className={classes.cardContent}>
                    <Typography gutterBottom variant="headline" component="h2">
                        {data.metadata.firstname} {data.metadata.name}
                    </Typography>
                    <Typography>
                        {data.metadata.description}
                    </Typography>
                </CardContent>
                <CardActions className={classes.cardActions}>
                    <Link to={`app/${data.uuid}/view`}>
                        <Button variant="contained" color="primary">
                            View
                        </Button>
                    </Link>
                    <Link to={`app/${data.uuid}`}>
                        <Button variant="contained" color="secondary">
                            Edit
                        </Button>
                    </Link>
                </CardActions>
            </Card>
        </div>
    )
}

ResumeCard.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ResumeCard);