import {observable, action, computed} from 'mobx';

export default class CursorStore {
    @observable shapes = [];

    disposables = [];

    @computed get lastShape() {
        return this.shapes[this.shapes.length-1];
    }

    @computed get currentPoint() {
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            var shape = this.shapes[i];
            if (shape.length !== 0) {
                return shape[shape.length-1];
            }
        }
    }

    @action dispose() {
        this.shapes = [];
        let disposable;
        while (disposable = this.disposables.shift()) {
            disposable.dispose();
        }
    }
}