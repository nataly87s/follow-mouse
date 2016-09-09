import mobx, {observable, computed, action} from 'mobx';

import Rx from 'rx';
import CursorStore from './CursorStore';

export default class extends CursorStore {
    @observable shapes = [];

    @computed get lastShape() {
        return this.shapes[this.shapes.length-1];
    }

    init = () => {
        this.disposables.push(this.mouseSubject.distinctUntilChanged().filter(m => m).subscribe(_=>this.shapes.push([])));
        this.disposables.push(this.onMouseMove.subscribe(item => this.lastShape.push(item)));
    }
    @action dispose() {
        super.dispose();
        this.shapes = [];
    }
}