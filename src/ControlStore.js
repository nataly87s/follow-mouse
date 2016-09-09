import mobx, {observable} from 'mobx';

import Rx from 'rx';
import CursorStore from './CursorStore';

export default class extends CursorStore {
    @observable trail = [];

    init = () => {
        const disposable = this.onMouseMove
            .map(position => {
                const index = this.trail.length === 0 ? 0 : this.trail[this.trail.length-1].index +1;
                return {position, index, opacity: 1, show: true};
            })
            .doOnNext(item => this.trail.push(item))
            .flatMap(x => Rx.Observable.just(x).delay(100))
            .doOnNext(item => item.show = false)
            .flatMap(x => {
                const observable = Rx.Observable.just(x);
                if (this.trail.filter(t => t.show).length > 0) return observable;
                return this.subject
                            .take(1)
                            .takeUntil(this.mouseSubject.filter(x => !x))
                            .last({defaultValue: 1})
                            .flatMap(_=>observable);
            })
            .doOnNext(x => x.opacity = 0)
            .flatMap(x => Rx.Observable.just(x).delay(500))
            .doOnNext(x => this.trail.shift())
            .subscribe();

        this.disposables.push(disposable);
    }
}