import mobx, {observable, action, computed} from 'mobx';
import Rx from 'rx';

export default class CursorStore {
    constructor() {
        this.mouseSubject.onNext(false);
    }

    @observable currentLocation = {x:0, y:0};
    @observable shapes = [];
    subject = new Rx.Subject();
    mouseSubject = new Rx.ReplaySubject(1);
    onMouseMove = this.subject.throttle(10);
    disposables = [];
    autorunDispose = null;

    @computed get lastShape() {
        return this.shapes[this.shapes.length-1];
    }

    @action mouseEvent = (isPressed) => {
        this.mouseSubject.onNext(isPressed);
        if (isPressed) {
            this.subject.onNext(this.currentLocation);
            this.autorunDispose = mobx.autorun(() => this.subject.onNext(this.currentLocation))
        } else {
            this.disposeAutorun();
        }
    }

    @action dispose() {
        this.disposeAutorun();
        this.shapes = [];
        let disposable;
        while (disposable = this.disposables.shift()) {
            disposable.dispose();
        }
    }

    disposeAutorun() {
        if (this.autorunDispose) {
            this.autorunDispose();
            this.autorunDispose = null;
        }
    }

}