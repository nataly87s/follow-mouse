import React from 'react';
import {observer} from 'mobx-react';
import R from 'ramda';
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

    init(store) {
        const container = document.getElementById(this.state.uuid);

        const mouseUp = DOM.mouseup(document).share();
        var mouseDown = DOM.mousedown(container).share();

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

        const onMouseMove = mouseDown
            .flatMap(x => DOM.mousemove(container).takeUntil(mouseUp))
            .map(e => {
                return {x: e.offsetX, y: e.offsetY}
            })
            .doOnNext(location => store.currentLocation = location)
            .throttle(10)
            .share();

        const mouseMove = onMouseMove
            .doOnNext(m => {
                if (this.props.onMouseMove) {
                    this.props.onMouseMove(m);
                }
            })
            .map(position => {
                const index = store.lastShape.length === 0 ? 0 : store.lastShape[store.lastShape.length - 1].index + 1;
                return {position, index, opacity: 1, show: true};
            })
            .doOnNext(item => store.lastShape.push(item))
            .flatMap(x => this.props.fade ? Rx.Observable.just(x).delay(1) : Rx.Observable.empty())
            .flatMap(x => {
                const observable = Rx.Observable.just(x);
                x.show = false;
                if (R.flatten(store.shapes).filter(t => t.show).length > 0) return observable;
                return onMouseMove
                    .take(1)
                    .takeUntil(mouseUp)
                    .last({defaultValue: 1})
                    .flatMap(_=>observable);
            })
            .doOnNext(x => x.opacity = 0)
            .flatMap(x => Rx.Observable.just(x).delay(this.props.fadeDelay || 500))
            .doOnNext(x =>  this.removePoint(x))
            .subscribe();

        store.disposables.push(mouseMove);
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