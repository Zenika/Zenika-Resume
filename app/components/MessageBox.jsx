import React from 'react';
import PropTypes from 'prop-types';
const { number, func, object } = PropTypes;

export const MessageBox = (props) => {
  const _onClick = () => {
    props.doClose(props.index);
  };

  if (props.message && props.message.content) {
    return (
      <div className={`message-box ${props.message.type}`}>
        <p>{props.message.content}</p>
        <button
          className="close-button"
          onClick={_onClick}
        >
          <span>&times;</span>
        </button>
      </div>
    );
  }

  return (<noscript />);
};

MessageBox.propTypes = {
  index: number.isRequired,
  message: object.isRequired,
  doClose: func.isRequired
};


const MessageBoxes = (props) => (
  <div className="message-boxes">
    {props.messages.map((message, index) =>
      <MessageBox
        message={message}
        index={index}
        key={index}
        doClose={props.closeMessageBox}
      />
    )}
  </div>
);

MessageBoxes.propTypes = {
  messages: object.isRequired,
  closeMessageBox: func.isRequired
};

export default MessageBoxes;
