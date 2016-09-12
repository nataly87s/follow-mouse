import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, browserHistory, IndexRoute } from 'react-router'

import DrawCanvas from './DrawCanvas';
import CursorStore from './CursorStore';
import './Cursor.less';

const store = new CursorStore();
const Drawing = props => <div>
    <DrawCanvas drawLines={true} {...{store}} />
    <button onClick={() => store.shapes = []}>clear</button>
</div>;
const Controlling = props => <DrawCanvas radius={8} drawLines={false} {...{store}}/> ;
const NoMatch = props => <div>:(</div>;

const App = props =>
    <div>
        <ul>
            <li><Link to={'/draw'}>Draw</Link></li>
            <li><Link to={'/control'}>Control</Link></li>
        </ul>
        {props.children}
    </div>;

ReactDOM.render((
    <Router history={browserHistory}>
        <Route path="/" component={App}>
            <IndexRoute component={NoMatch} />
            <Route path="control" component={Controlling}/>
            <Route path="draw" component={Drawing}/>
            <Route path="*" component={NoMatch}/>
        </Route>
    </Router>
  ), document.getElementById('root'));
