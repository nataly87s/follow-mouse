import React from 'react';
import {observer} from 'mobx-react';
import R from 'ramda';
import Rx from 'rx';

import ReactCursorPosition from 'react-cursor-position';
import {Polyline, Circle} from 'react-shapes';
import CursorStore from './CursorStore';

const getShape = (shape) => {
    const s_shape = shape.map(({position}) => `${position.x},${position.y}`).join(' ');
    if (shape.length === 1) return `${s_shape} ${s_shape}`;
    return s_shape;
};

@observer
class DrawContainer extends React.Component {
    componentDidMount() {
        this.init(this.props.store);
    }

    componentWillUnmount() {
        const {store} = this.props;
        store.dispose();
    }

    componentWillReceiveProps({store}) {
        if (store != this.props.store) {
            this.props.store.dispose();
            this.init(store);
        }
    }

    init(store) {
        const mouseButton = store.mouseSubject
            .distinctUntilChanged()
            .doOnNext(m => {
                if (this.props.onMouseButton) {
                    this.props.onMouseButton(m);
                }
            })
            .filter(m => m)
            .subscribe(_=> store.shapes.push([]));

        const mouseMove = store.subject
            .throttle(10)
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
            .flatMap(x => this.props.fade ? Rx.Observable.just(x).delay(10) : Rx.Observable.empty())
            .doOnNext(item => item.show = false)
            .flatMap(x => {
                const observable = Rx.Observable.just(x);
                if (R.flatten(store.shapes).filter(t => t.show).length > 0) return observable;
                return store.subject
                    .take(1)
                    .takeUntil(store.mouseSubject.filter(x => !x))
                    .last({defaultValue: 1})
                    .flatMap(_=>observable);
            })
            .doOnNext(x => x.opacity = 0)
            .flatMap(x => Rx.Observable.just(x).delay(this.props.fadeDelay || 500))
            .doOnNext(x => store.shapes.filter(s => s.length > 0)[0].shift())
            .subscribe();

        store.disposables.push(mouseButton);
        store.disposables.push(mouseMove);
    }

    render() {
        const {store, drawLines = false, radius = 2, color = 'red', fadeDelay = 500} = this.props;
        return (
            <ReactCursorPosition shouldDecorateChildren={false}
                                 onCursorPositionChanged={position => store.currentLocation = position}>
                <div className="container"
                     onMouseDown={() => store.mouseEvent(true)}
                     onMouseUp={() => store.mouseEvent(false)}>
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
                                                opacity: point.opacity,
                                                position: 'absolute',
                                                pointerEvents: 'none',
                                                transition: `opacity ${fadeDelay / 1000}s`
                                            }}>
                                                <Circle style r={radius} fill={{color}}/>
                                            </div>)
                                            :
                                            <Polyline points={getShape(shape)} fillOpacity={0}
                                                      stroke={{color}} strokeWidth={radius * 2}
                                                      strokeLinecap='round'/>
                                    }
                                </div>)
                    }
                </div>
            </ReactCursorPosition>
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