import React from 'react';
import PropTypes from 'prop-types';

const { func } = PropTypes;

const VerticalHandler = (props) => (
  <div className="vertical-handler">
    <div
      className="left"
      title="Reduce markdown editor"
      onClick={props.onClickLeft}
    >
      <i className="fa fa-chevron-left"></i>
    </div>
    <div
      className="right"
      title="Reduce preview"
      onClick={props.onClickRight}
    >
      <i className="fa fa-chevron-right"></i>
    </div>
  </div>
);

VerticalHandler.propTypes = {
  onClickLeft: func.isRequired,
  onClickRight: func.isRequired
};

export default VerticalHandler;
