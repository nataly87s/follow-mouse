import React from 'react';
import {lifecycle} from 'recompose';

export default (Store, Component) => {
    const store = new Store();
    const enhance = lifecycle({
        componentDidMount() {
            store.init();
        },

        componentWillUnmount() {
            store.dispose();
        }
    }) 
    return enhance(props => <Component {...props} store={store} />)
}