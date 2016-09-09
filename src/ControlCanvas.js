import React from 'react';
import {observer} from 'mobx-react';

import ReactCursorPosition from 'react-cursor-position';
import createCircle from './createCircle';
import StoreWrapper from './StoreWrapper';
import ControlStore from './ControlStore';
import './Cursor.less';

const Circle = createCircle(8);

const ControlCanvas = ({store}) =>
  <ReactCursorPosition shouldDecorateChildren={false} onCursorPositionChanged={store.moveCursor}>
    <div className="container"
          onMouseDown={() => store.mouseEvent(true)}
          onMouseUp={() => store.mouseEvent(false)}>
      {
        store.trail.map((point) => <Circle key={point.index} {...point.position} opacity={point.opacity} />)
      }
    </div>
  </ReactCursorPosition>

export default StoreWrapper(ControlStore, observer(ControlCanvas));