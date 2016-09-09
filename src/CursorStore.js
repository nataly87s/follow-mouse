import mobx, {observable, action} from 'mobx';
import Rx from 'rx';

export default class CursorStore {
    constructor() {
        this.mouseSubject.onNext(false);
    }

    @observable isMousePressed = false;
    @observable currentLocation = {x:0, y:0};
    subject = new Rx.Subject();
    mouseSubject = new Rx.ReplaySubject(1);
    onMouseMove = this.subject.throttle(5);
    disposables = [];

    addCursor() {
        this.subject.onNext(this.currentLocation);
    }

    moveCursor = (position) => {
        this.currentLocation = position;
        if (this.isMousePressed) {
            this.addCursor();
        }
    }

    mouseEvent = (isPressed) => {
        this.mouseSubject.onNext(isPressed);
        this.isMousePressed = isPressed;
        if (this.isMousePressed) {
            this.addCursor();
        }
    }

    init = () => {}
    @action dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}