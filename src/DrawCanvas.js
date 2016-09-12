import React from 'react';
import {observer} from 'mobx-react';
import Rx from 'rx';
import {DOM} from 'rx-dom';
import {uuid} from 'lil-uuid/uuid';

import {Polyline, Circle} from 'react-shapes';
import CursorStore from './CursorStore';

@observer
class DrawContainer extends React.Component {
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
        for (let i = shapes.length -1; i >= 0; i--) {
            const index = shapes[i].indexOf(point);
            if (index > -1) {
                shapes[i].splice(i,1);
            }
            if (shapes[i].length == 0) {
                shapes.splice(i,1);
            }
        }
    }

    fadePoint(point) {
        point.opacity = 0;
        Rx.Observable.timer(this.props.fadeDelay || 500).subscribe(_ =>  this.removePoint(point))
    }

    init(store) {
        const container = document.getElementById(this.state.uuid);

        const mouseUp = DOM.mouseup(document).share();
        const mouseDown = DOM.mousedown(container).share();

        const onMousePressed = Rx.Observable.merge(
            mouseUp.map(_=>false),
            mouseDown.flatMap(_=> Rx.Observable.merge(
                Rx.Observable.just(true),
                DOM.mouseenter(container).map(_=>true),
                DOM.mouseleave(container).map(_=>false)
                ).takeUntil(mouseUp)
            ))
            .distinctUntilChanged()
            .subscribe(isPressed => {
                if (isPressed) {
                    store.shapes.push([])
                }
                if (this.props.onMouseButton) {
                    this.props.onMouseButton(isPressed);
                }
            });

        store.disposables.push(onMousePressed);


        const onMouseMove = mouseDown.flatMap(_=>
            DOM.mousemove(container)
                .takeUntil(mouseUp)
                .throttle(10)
                .map(e => {
                    return {x: e.offsetX, y: e.offsetY}
                })
                .doOnNext(point => {
                    if (this.props.onMouseMove) {
                        this.props.onMouseMove(point);
                    }
                })
                .map(position => {
                    const index = store.lastShape.length === 0 ? 0 : store.lastShape[store.lastShape.length - 1].index + 1;
                    return {position, index, opacity: 1, show: true};
                })
                .doOnNext(point => store.lastShape.push(point))
                .flatMap(x => this.props.fade ? Rx.Observable.just(x).delay(1) : Rx.Observable.empty())
                .pairwise()
                .doOnNext(point => this.fadePoint(point[0]))
                .last({defaultValue: [null,null]})
        ).subscribe(point => this.fadePoint( point[1] || store.currentPoint));
        store.disposables.push(onMouseMove);
    }

    render() {
        const {store, drawLines = false, radius = 2, color = 'red', fadeDelay = 500} = this.props;
        return (
            <div className="container" id={this.state.uuid}>
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
                                        <Polyline points={shape.map(({position}) => `${position.x},${position.y}`).join(' ')}
                                                  fillOpacity={0} stroke={{color}} strokeWidth={radius * 2} strokeLinecap='round'/>
                                }
                            </div>)
                }
            </div>

        );
    }
}

DrawContainer.propTypes = {
    onMouseButton: React.PropTypes.func,
    onMouseMove: React.PropTypes.func,
    store: React.PropTypes.instanceOf(CursorStore).isRequired,
    drawLines: React.PropTypes.bool,
    fade: React.PropTypes.bool,
    radius: React.PropTypes.number,
    color: React.PropTypes.string,
    fadeDelay: React.PropTypes.number
};

export default DrawContainer;