import mobx, {observable, action, computed} from 'mobx';
import Rx from 'rx';

export default class CursorStore {
    constructor() {
        this.mouseSubject.onNext(false);
        mobx.autorun(() => {
            if (this.isMousePressed) {
                this.subject.onNext(this.currentLocation)
            }
        })
    }

    @observable currentLocation = {x:0, y:0};
    @observable shapes = [];
    @observable isMousePressed = false;

    subject = new Rx.Subject();
    mouseSubject = new Rx.ReplaySubject(1);

    disposables = [];

    @computed get lastShape() {
        return this.shapes[this.shapes.length-1];
    }

    @action mouseEvent = (isPressed) => {
        this.mouseSubject.onNext(isPressed);
        this.isMousePressed = isPressed;
    }

    @action dispose() {
        this.shapes = [];
        let disposable;
        while (disposable = this.disposables.shift()) {
            disposable.dispose();
        }
    }

}