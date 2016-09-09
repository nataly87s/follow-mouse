import React from 'react';
import {observer} from 'mobx-react';

import ReactCursorPosition from 'react-cursor-position';
import {Polyline} from 'react-shapes';
import StoreWrapper from './StoreWrapper';
import DrawStore from './DrawStore';
import createCircle from './createCircle';
import './Cursor.less';

const Circle = createCircle(2);
const getShape = (shape) => {
    const s_shape = shape.map(({x,y}) => `${x},${y}`).join(' ');
    if (shape.length === 1) return `${s_shape} ${s_shape}`;
    return s_shape;
}

const DrawContainer = ({store}) =>
  <ReactCursorPosition shouldDecorateChildren={false} onCursorPositionChanged={store.moveCursor}>
    <div>
        <div className="container"
            onMouseDown={() => store.mouseEvent(true)}
            onMouseUp={() => store.mouseEvent(false)}>
        {
            store.shapes.map((shape, index) => 
                shape.length === 0 ?
                null :
                <div key={index} style={{position: 'absolute', pointerEvents:'none'}}>
                    {
                        shape.length === 1 ?
                        <Circle {...shape[0]} />:
                        <Polyline points={getShape(shape)} fillOpacity={0} stroke={{color:'red'}} strokeWidth={3} strokeLinecap='round' />
                    }
                </div>)
        }
        </div>
        <button onClick={() => store.shapes = []}>clear</button>
    </div>
  </ReactCursorPosition>

export default StoreWrapper(DrawStore, observer(DrawContainer));