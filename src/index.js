import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, browserHistory, IndexRoute } from 'react-router'

import DrawCanvas from './DrawCanvas';
import ControlCanvas from './ControlCanvas';

const NoMatch = props => <div>:(</div>
const App = props => 
    <div>
        <ul>
            <li><Link to={'/draw'}>Draw</Link></li>
            <li><Link to={'/control'}>Control</Link></li>
        </ul>
        {props.children}
    </div>
  
  
ReactDOM.render((
    <Router history={browserHistory}>
        <Route path="/" component={App}>
            <IndexRoute component={NoMatch} />
            <Route path="control" component={ControlCanvas}/>
            <Route path="draw" component={DrawCanvas}/>
            <Route path="*" component={NoMatch}/>
        </Route>
    </Router>
  ), document.getElementById('root'));
