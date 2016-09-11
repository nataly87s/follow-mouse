import React, { PropTypes } from 'react';
import {setPropTypes} from 'recompose';

const propTypes = setPropTypes({
    x: PropTypes.number,
    y: PropTypes.number,
    opacity: PropTypes.number,
    className: PropTypes.string
});

export default propTypes(({x=0,y=0, opacity=1,className = '', radius}) =>
<div style={{position: 'absolute'}} >
  <div className={`circle ${className}`} 
    style={{top: y-radius, left: x-radius, opacity, borderRadius: radius, width: radius*2, height: radius*2, position: 'relative', pointerEvents:'none'}}>
  </div>
  </div>)