import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Events} from '../Store';

const DEFAULT_DURATION = 5;
const MAX_DURATION = 600;

export default class Sync extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      duration: DEFAULT_DURATION,
      counter: DEFAULT_DURATION,
      offline: false,
      displayCounter: true
    };
  }

  componentWillMount() {
    this.interval = setInterval(() => {
      let counter = this.state.counter;

      if (0 < counter) {
        counter--;
        this.setState({counter: counter});

        if (0 === counter) {
          this.setState({counter: DEFAULT_DURATION});
          this.context.controller.dispatch('action:sync');
        }
      }
    }, 1000);
  }

  componentDidMount() {
    this.context.controller.on(Events.APP_IS_ONLINE, () => {
      this.setState({
        counter: DEFAULT_DURATION,
        duration: DEFAULT_DURATION,
        offline: false,
        displayCounter: true
      });
    });

    this.context.controller.on(Events.APP_IS_OFFLINE, () => {
      const displayCounter = DEFAULT_DURATION === this.state.duration;
      let duration = Math.round(this.state.duration * 2);

      if (duration >= MAX_DURATION) {
        duration = DEFAULT_DURATION + 1;
      }

      this.setState({
        counter: duration,
        duration: duration,
        offline: true,
        displayCounter: displayCounter
      });
    });
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    let title = 'Connected to the Internets™';
    let offlineStatus = '';

    if (this.state.offline) {
      title = 'No Internet connection or server is unreachable';

      if (this.state.displayCounter) {
        offlineStatus = (<span>&nbsp;Retrying in {this.state.counter} seconds</span>);
      } else {
        offlineStatus = (<span>&nbsp;Offline</span>);
      }
    }

    return (
      <div className="sync">
        <span className={this.state.offline ? 'status is-offline' : 'status is-online'}>
          <i title={title}
             className={this.state.offline ? 'fa fa-toggle-off' : 'fa fa-toggle-on'}></i>
          {offlineStatus}
        </span>
      </div>
    );
  }
}

Sync.contextTypes = {
  controller: PropTypes.object.isRequired
};
