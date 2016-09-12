import {observable, action, computed} from 'mobx';

export default class CursorStore {
    @observable shapes = [];

    disposables = [];

    @computed get lastShape() {
        return this.shapes[this.shapes.length-1];
    }

    @action dispose() {
        this.shapes = [];
        let disposable;
        while (disposable = this.disposables.shift()) {
            disposable.dispose();
        }
    }
}