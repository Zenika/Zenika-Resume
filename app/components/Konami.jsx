import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Konami from 'konami';

const { string, func } = PropTypes;

export default class KonamiCode extends Component {
  constructor(props) {
    super(props);
    this.state = {
        isAnimate: false,
        sound: new Audio('http://www.dinosoria.com/generiques/dessins_anime/bonne_nuit_%20petits%201.mp3'),
        animationDuration: 10000,
    };
    this.startAnimation = this.startAnimation.bind(this);
  }

  componentDidMount() {
   new Konami(() => {this.startAnimation();});
  }

  startAnimation() {
    this.setState({
        isAnimate: true,
    });
    this.state.sound.play();

    setTimeout(()=> {
        this.setState({
            isAnimate: false,
        });
        this.state.sound.pause();
        this.state.sound.currentTime = 0;
    }, this.state.animationDuration)
  }

  render() {

    if (!this.state.isAnimate ) {
        return (<div/>)
    }

    return (
      <div className="konami">
        <img src="/static/img/bnlp.png" alt="Nounours"/>
      </div>
    );
  }
}

KonamiCode.propTypes = {
};
