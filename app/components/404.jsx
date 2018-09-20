import React, { Component } from 'react'
import Button from '@material-ui/core/Button';
import { Link } from 'react-router-dom'

export class Page404 extends Component {
  render() {
    return (
      <div style={{textAlign: 'center'}}>
        
        <img src="https://media.giphy.com/media/HqLFVxqEpi4Rq/source.gif" alt="404" />
        <br/>
        <Link to="/">
          <Button variant="contained" color="secondary">
            Go to home
        </Button>
        </Link>
      </div>
    )
  }
}

export default Page404
