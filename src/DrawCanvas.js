import React from 'react';
import {observer} from 'mobx-react';
import Rx from 'rx';
import {DOM} from 'rx-dom';
import {uuid} from 'lil-uuid/uuid';

import {Polyline, Circle} from 'react-shapes';
import CursorStore from './CursorStore';

@observer
class DrawCanvas extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            uuid: uuid()
        }
    }

    componentDidMount() {
        this.init(this.props.store);
    }

    componentWillUnmount() {
        const {store} = this.props;
        store.dispose();
    }

    componentWillReceiveProps({store}) {
        if (store != this.props.store) {
            store.disposables = this.props.store.disposables;
        }
    }

    removePoint(point) {
        let shapes = this.props.store.shapes;
        for (let i = shapes.length - 1; i >= 0; i--) {
            const index = shapes[i].indexOf(point);
            if (index > -1) {
                shapes[i].splice(i, 1);
            }
            if (shapes[i].length == 0) {
                shapes.splice(i, 1);
            }
        }
    }

    fadePoint(point) {
        if (this.props.drawLines) return;
        point.opacity = 0;
        Rx.Observable.timer(this.props.fadeDelay || 500).subscribe(_ => this.removePoint(point))
    }

    init(store) {
        const container = document.getElementById(this.state.uuid);

        const mouseUp = DOM.mouseup(document).share();
        const mouseDown = DOM.mousedown(container).share();

        const getPosition = e => {
            return {x: e.offsetX, y: e.offsetY}
        };

        const onMouseButtonStateChanged = Rx.Observable.merge(
            mouseUp.map(_=>false),
            mouseDown.flatMap(e=> Rx.Observable.merge(
                Rx.Observable.just(e),
                DOM.mouseenter(container),
                DOM.mouseleave(container).map(_=>false)
                ).takeUntil(mouseUp)
            ))
            .distinctUntilChanged()
            .share();

        const onMousePressed = onMouseButtonStateChanged.filter(t => t);
        const onMouseReleased = onMouseButtonStateChanged.filter(t => !t);

        const onMouseMove = onMousePressed
            .doOnNext(e => {
                store.shapes.push([]);
                if (this.props.onMouseButton) {
                    this.props.onMouseButton(true, getPosition(e));
                }
            })
            .flatMap(firstPoint=>
                DOM.mousemove(container)
                    .startWith(firstPoint)
                    .takeUntil(onMouseReleased)
                    .throttle(this.props.throttle || 10)
                    .map(e => {
                        const index = store.lastShape.length === 0 ? 0 : store.lastShape[store.lastShape.length - 1].index + 1;
                        return {position: getPosition(e), index, opacity: 1};
                    })
                    .doOnNext(point => {
                        store.lastShape.push(point);
                        if (point.index > 0 && this.props.onMouseMove) {
                            this.props.onMouseMove(point.position);
                        }
                    })
                    .concat('')
                    .pairwise()
                    .map(x=>x[0])
                    .doOnNext(this.fadePoint)
                    .last()
                    .doOnNext(point => {
                        if (this.props.onMouseButton) {
                            this.props.onMouseButton(false, point.position);
                        }
                    })
            )
            .subscribe();
        store.disposables.push(onMouseMove);
    }

    render() {
        const {store, drawLines = false, radius = 2, color = 'red', fadeDelay = 500, style} = this.props;
        return (
            <div className="draw-canvas-container" id={this.state.uuid} style={style}>
                {
                    store.shapes.map((shape, index) =>
                        shape.length === 0 ?
                            null :
                            <div key={index} style={{position: 'absolute', pointerEvents: 'none'}}>
                                {
                                    shape.length === 1 || !drawLines ?
                                        shape.map((point) => <div key={point.index} style={{
                                            top: point.position.y - radius,
                                            left: point.position.x - radius,
                                            display: 'flex',
                                            opacity: point.opacity,
                                            position: 'absolute',
                                            pointerEvents: 'none',
                                            transition: `opacity ${fadeDelay / 1000}s`
                                        }}>
                                            <Circle r={radius} fill={{color}}/>
                                        </div>)
                                        :
                                        <Polyline
                                            points={shape.map(({position}) => `${position.x},${position.y}`).join(' ')}
                                            fillOpacity={0} stroke={{color}} strokeWidth={radius * 2}
                                            strokeLinecap='round'/>
                                }
                            </div>)
                }
            </div>
        );
    }
}

DrawCanvas.propTypes = {
    onMouseButton: React.PropTypes.func,
    onMouseMove: React.PropTypes.func,
    store: React.PropTypes.instanceOf(CursorStore).isRequired,
    drawLines: React.PropTypes.bool,
    radius: React.PropTypes.number,
    color: React.PropTypes.string,
    fadeDelay: React.PropTypes.number,
    throttle: React.PropTypes.number
};

export default DrawCanvas;
